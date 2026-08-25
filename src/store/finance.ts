import { create } from "zustand";
import { api } from "@/services/api";
import { DEFAULT_CATEGORIES } from "@/services/seed";
import { Category, RecurringRule, Transaction } from "@/types";
import { dueOccurrences, todayISO } from "@/lib/recurring";

interface FinanceState {
  userId: string | null;
  transactions: Transaction[];
  categories: Category[];
  recurring: RecurringRule[];
  loaded: boolean;
  load: (userId: string) => Promise<void>;
  reset: () => void;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, "id" | "createdAt">>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, "id" | "isCustom">) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addRecurring: (r: Omit<RecurringRule, "id" | "createdAt" | "lastPostedDate">) => Promise<void>;
  updateRecurring: (id: string, patch: Partial<Omit<RecurringRule, "id" | "createdAt" | "lastPostedDate">>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
}

const recurringTxKey = (ruleId: string, date: string) => `${ruleId}:${date}`;

const matchesRecurringRule = (tx: Transaction, rule: RecurringRule, date: string) =>
  tx.date === date &&
  tx.amount === rule.amount &&
  tx.type === rule.type &&
  tx.categoryId === rule.categoryId &&
  tx.description === rule.description;

function normalizeRecurringTransactions(transactions: Transaction[], rules: RecurringRule[], today: string) {
  const duplicatesToRemove = new Set<string>();
  const recurringIdsByTransaction = new Map<string, string>();

  for (const rule of rules) {
    const dates = dueOccurrences(rule.startDate, rule.frequency, undefined, today);
    for (const date of dates) {
      const matches = transactions.filter((tx) => matchesRecurringRule(tx, rule, date));
      if (!matches.length) continue;
      const recurringCandidates = matches.filter(
        (tx) => tx.recurringRuleId === rule.id || tx.createdAt >= rule.createdAt
      );
      if (!recurringCandidates.length) continue;
      const primary = recurringCandidates.find((tx) => tx.recurringRuleId === rule.id) ?? recurringCandidates[0];
      recurringIdsByTransaction.set(primary.id, rule.id);
      for (const duplicate of recurringCandidates.filter((tx) => tx.id !== primary.id)) {
        duplicatesToRemove.add(duplicate.id);
      }
    }
  }

  if (!duplicatesToRemove.size && !recurringIdsByTransaction.size) {
    return { transactions, changed: false };
  }

  const normalized = transactions
    .filter((tx) => !duplicatesToRemove.has(tx.id))
    .map((tx) => {
      const recurringRuleId = tx.recurringRuleId ?? recurringIdsByTransaction.get(tx.id);
      return recurringRuleId ? { ...tx, recurringRuleId } : tx;
    });

  return { transactions: normalized, changed: true };
}

let loadingFor: string | null = null;

export const useFinance = create<FinanceState>((set, get) => ({
  userId: null,
  transactions: [],
  categories: [],
  recurring: [],
  loaded: false,
  load: async (userId) => {
    if (loadingFor === userId) return;
    const state = get();
    if (state.loaded && state.userId === userId) return;
    loadingFor = userId;
    set({ loaded: false, userId });
    try {
      const [transactions, categories, rules] = await Promise.all([
        api.transactions.list(),
        api.categories.list(),
        api.recurring.list(),
      ]);

      if (!categories.length) {
        for (const c of DEFAULT_CATEGORIES) {
          await api.categories.create(c);
        }
        const freshCategories = await api.categories.list();
        set({ categories: freshCategories });
      } else {
        set({ categories });
      }

      let txs = transactions;
      let recRules = rules;

      const today = todayISO();
      const normalized = normalizeRecurringTransactions(txs, recRules, today);
      if (normalized.changed) txs = normalized.transactions;
      const existingRecurringTxs = new Set(
        txs
          .filter((tx) => tx.recurringRuleId)
          .map((tx) => recurringTxKey(tx.recurringRuleId as string, tx.date))
      );
      const newTxs: Transaction[] = [];
      const updatedRules: RecurringRule[] = [];
      recRules = recRules.map((rule) => {
        const dates = dueOccurrences(rule.startDate, rule.frequency, rule.lastPostedDate, today);
        if (!dates.length) return rule;
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
          });
        }
        const updatedRule = { ...rule, lastPostedDate: dates[dates.length - 1] };
        updatedRules.push(updatedRule);
        return updatedRule;
      });
      if (newTxs.length) {
        for (const tx of newTxs) {
          await api.transactions.create(tx);
        }
        for (const rule of updatedRules) {
          await api.recurring.update(rule.id, { lastPostedDate: rule.lastPostedDate });
        }
        txs = [...newTxs, ...txs].sort((a, b) => b.date.localeCompare(a.date));
      } else if (normalized.changed) {
        txs = txs.sort((a, b) => b.date.localeCompare(a.date));
      }

      set({ transactions: txs, recurring: recRules, loaded: true });
    } finally {
      if (loadingFor === userId) loadingFor = null;
    }
  },
  reset: () => {
    loadingFor = null;
    set({ userId: null, transactions: [], categories: [], recurring: [], loaded: false });
  },
  addTransaction: async (t) => {
    const tx = await api.transactions.create(t);
    const transactions = [tx, ...get().transactions];
    set({ transactions });
  },
  updateTransaction: async (id, patch) => {
    const tx = await api.transactions.update(id, patch);
    const transactions = get().transactions.map((t) => (t.id === id ? tx : t));
    set({ transactions });
  },
  deleteTransaction: async (id) => {
    await api.transactions.delete(id);
    const transactions = get().transactions.filter((t) => t.id !== id);
    set({ transactions });
  },
  addCategory: async (c) => {
    const cat = await api.categories.create(c);
    const categories = [...get().categories, cat];
    set({ categories });
  },
  updateCategory: async (id, patch) => {
    const cat = await api.categories.update(id, patch);
    const categories = get().categories.map((c) => (c.id === id ? cat : c));
    set({ categories });
  },
  deleteCategory: async (id) => {
    await api.categories.delete(id);
    const categories = get().categories.filter((c) => c.id !== id);
    set({ categories });
  },
  addRecurring: async (r) => {
    const rule = await api.recurring.create(r);
    const today = todayISO();
    const dates = dueOccurrences(rule.startDate, rule.frequency, undefined, today);
    const firstDueDate = dates[0];
    const newTxs: Transaction[] = firstDueDate
      ? [
          {
            id: crypto.randomUUID(),
            amount: rule.amount,
            type: rule.type,
            categoryId: rule.categoryId,
            date: firstDueDate,
            description: rule.description,
            createdAt: new Date().toISOString(),
            recurringRuleId: rule.id,
          },
        ]
      : [];
    if (firstDueDate) {
      await api.recurring.update(rule.id, { lastPostedDate: firstDueDate });
      rule.lastPostedDate = firstDueDate;
    }
    const recurring = [...get().recurring, rule];
    if (newTxs.length) {
      for (const tx of newTxs) {
        await api.transactions.create(tx);
      }
      const transactions = [...newTxs, ...get().transactions].sort((a, b) => b.date.localeCompare(a.date));
      set({ recurring, transactions });
    } else {
      set({ recurring });
    }
  },
  deleteRecurring: async (id) => {
    await api.recurring.delete(id);
    const recurring = get().recurring.filter((r) => r.id !== id);
    set({ recurring });
  },
  updateRecurring: async (id, patch) => {
    const rule = await api.recurring.update(id, patch);
    const recurring = get().recurring.map((r) => (r.id === id ? rule : r));
    set({ recurring });
  },
}));
