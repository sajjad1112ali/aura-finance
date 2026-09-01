import { db } from '../db';
import { transactions as transactionsTable, recurringRules } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { dueOccurrences, todayISO } from '../../src/lib/recurring';

const recurringTxKey = (ruleId: string, date: string) => `${ruleId}:${date}`;

const matchesRecurringRule = (
  tx: { date: string; amount: number; type: string; categoryId: string; description: string },
  rule: { amount: number; type: string; categoryId: string; description: string },
  date: string
) =>
  tx.date === date &&
  tx.amount === rule.amount &&
  tx.type === rule.type &&
  tx.categoryId === rule.categoryId &&
  tx.description === rule.description;

export async function processRecurring(userId: string) {
  const rules = await db.select().from(recurringRules).where(eq(recurringRules.userId, userId)).all();
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).all();

  const today = todayISO();

  // 1. Normalize: find transactions that match a recurring occurrence, tag
  //    them with the rule id, and drop exact duplicates.
  const duplicatesToRemove = new Set<string>();
  const recurringIdsByTransaction = new Map<string, string>();

  for (const rule of rules) {
    const dates = dueOccurrences(rule.startDate, rule.frequency, undefined, today);
    for (const date of dates) {
      const matches = txs.filter((tx) => matchesRecurringRule(tx, rule, date));
      if (!matches.length) continue;
      const recurringCandidates = matches.filter(
        (tx) => tx.recurringRuleId === rule.id || (tx.createdAt || '') >= rule.createdAt
      );
      if (!recurringCandidates.length) continue;
      const primary =
        recurringCandidates.find((tx) => tx.recurringRuleId === rule.id) ?? recurringCandidates[0];
      recurringIdsByTransaction.set(primary.id, rule.id);
      for (const duplicate of recurringCandidates.filter((tx) => tx.id !== primary.id)) {
        duplicatesToRemove.add(duplicate.id);
      }
    }
  }

  // 2. Auto-post: create any occurrences that are due after lastPostedDate.
  const existingRecurringTxs = new Set(
    txs
      .filter((tx) => tx.recurringRuleId)
      .map((tx) => recurringTxKey(tx.recurringRuleId as string, tx.date))
  );
  const newTxs: {
    id: string;
    amount: number;
    type: string;
    categoryId: string;
    date: string;
    description: string;
    createdAt: string;
    recurringRuleId: string;
    userId: string;
  }[] = [];
  const updatedRules: { id: string; lastPostedDate: string }[] = [];

  for (const rule of rules) {
    const dates = dueOccurrences(rule.startDate, rule.frequency, rule.lastPostedDate || undefined, today);
    if (!dates.length) continue;
    for (const d of dates) {
      const key = recurringTxKey(rule.id, d);
      if (existingRecurringTxs.has(key)) continue;
      existingRecurringTxs.add(key);
      newTxs.push({
        id: crypto.randomUUID(),
        amount: rule.amount,
        type: rule.type,
        categoryId: rule.categoryId,
        date: d,
        description: rule.description,
        createdAt: new Date().toISOString(),
        recurringRuleId: rule.id,
        userId,
      });
    }
    updatedRules.push({ id: rule.id, lastPostedDate: dates[dates.length - 1] });
  }

  // 3. Apply all changes inside a transaction.
  await db.transaction(async (tx) => {
    if (duplicatesToRemove.size) {
      await tx.delete(transactionsTable).where(inArray(transactionsTable.id, [...duplicatesToRemove]));
    }
    for (const [txId, ruleId] of recurringIdsByTransaction) {
      if (duplicatesToRemove.has(txId)) continue;
      await tx
        .update(transactionsTable)
        .set({ recurringRuleId: ruleId })
        .where(eq(transactionsTable.id, txId));
    }
    if (newTxs.length) {
      await tx.insert(transactionsTable).values(newTxs);
    }
    for (const rule of updatedRules) {
      await tx
        .update(recurringRules)
        .set({ lastPostedDate: rule.lastPostedDate })
        .where(eq(recurringRules.id, rule.id));
    }
  });

  return {
    created: newTxs.length,
    removed: duplicatesToRemove.size,
    updated: updatedRules.length,
  };
}