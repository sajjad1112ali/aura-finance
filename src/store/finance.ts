import { create } from "zustand";
import { storage, STORAGE_KEYS } from "@/services/storage";
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

const txKey = (uid: string) => `${STORAGE_KEYS.transactions}.${uid}`;
const catKey = (uid: string) => `${STORAGE_KEYS.categories}.${uid}`;
const recKey = (uid: string) => `${STORAGE_KEYS.recurring}.${uid}`;

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

// Module-level guard to prevent concurrent loads (e.g. React StrictMode double-invoke
// in dev) from auto-posting the same recurring occurrences twice.
let loadingFor: string | null = null;

export const useFinance = create<FinanceState>((set, get) => ({
  userId: null,
  transactions: [],
  categories: [],
  recurring: [],
  loaded: false,
  load: async (userId) => {
    // Skip if we're already loading or have already loaded this user.
    if (loadingFor === userId) return;
    const state = get();
    if (state.loaded && state.userId === userId) return;
    loadingFor = userId;
    set({ loaded: false, userId });
    try {
    const [t, c, r] = await Promise.all([
      storage.get<Transaction[]>(txKey(userId)),
      storage.get<Category[]>(catKey(userId)),
      storage.get<RecurringRule[]>(recKey(userId)),
    ]);
    const categories = c && c.length ? c : DEFAULT_CATEGORIES;
    if (!c) await storage.set(catKey(userId), categories);
    let transactions = t ?? [];
    let rules = r ?? [];

    // Auto-post any due recurring occurrences up to today
    const today = todayISO();
    const normalized = normalizeRecurringTransactions(transactions, rules, today);
    if (normalized.changed) transactions = normalized.transactions;
    const existingRecurringTxs = new Set(
      transactions
        .filter((tx) => tx.recurringRuleId)
        .map((tx) => recurringTxKey(tx.recurringRuleId as string, tx.date))
    );
    const newTxs: Transaction[] = [];
    rules = rules.map((rule) => {
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
      return { ...rule, lastPostedDate: dates[dates.length - 1] };
    });
    if (newTxs.length) {
      transactions = [...newTxs, ...transactions].sort((a, b) => b.date.localeCompare(a.date));
      await storage.set(txKey(userId), transactions);
      await storage.set(recKey(userId), rules);
    } else if (normalized.changed) {
      await storage.set(txKey(userId), transactions);
    }

    set({ transactions, categories, recurring: rules, loaded: true });
    } finally {
      if (loadingFor === userId) loadingFor = null;
    }
  },
  reset: () => {
    loadingFor = null;
    set({ userId: null, transactions: [], categories: [], recurring: [], loaded: false });
  },
  addTransaction: async (t) => {
    const uid = get().userId;
    if (!uid) return;
    const tx: Transaction = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const transactions = [tx, ...get().transactions];
    await storage.set(txKey(uid), transactions);
    set({ transactions });
  },
  updateTransaction: async (id, patch) => {
    const uid = get().userId;
    if (!uid) return;
    const transactions = get().transactions.map((t) => (t.id === id ? { ...t, ...patch } : t));
    await storage.set(txKey(uid), transactions);
    set({ transactions });
  },
  deleteTransaction: async (id) => {
    const uid = get().userId;
    if (!uid) return;
    const transactions = get().transactions.filter((t) => t.id !== id);
    await storage.set(txKey(uid), transactions);
    set({ transactions });
  },
  addCategory: async (c) => {
    const uid = get().userId;
    if (!uid) return;
    const cat: Category = { ...c, id: crypto.randomUUID(), isCustom: true };
    const categories = [...get().categories, cat];
    await storage.set(catKey(uid), categories);
    set({ categories });
  },
  updateCategory: async (id, patch) => {
    const uid = get().userId;
    if (!uid) return;
    const categories = get().categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
    await storage.set(catKey(uid), categories);
    set({ categories });
  },
  deleteCategory: async (id) => {
    const uid = get().userId;
    if (!uid) return;
    const categories = get().categories.filter((c) => c.id !== id);
    await storage.set(catKey(uid), categories);
    set({ categories });
  },
  addRecurring: async (r) => {
    const uid = get().userId;
    if (!uid) return;
    const rule: RecurringRule = {
      ...r,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    // Create only the first due occurrence now; future ones are auto-posted on their scheduled dates.
    const today = todayISO();
    const dates = dueOccurrences(rule.startDate, rule.frequency, undefined, today);
    const firstDueDate = dates[0];
    const newTxs: Transaction[] = firstDueDate ? [{
      id: crypto.randomUUID(),
      amount: rule.amount,
      type: rule.type,
      categoryId: rule.categoryId,
      date: firstDueDate,
      description: rule.description,
      createdAt: new Date().toISOString(),
      recurringRuleId: rule.id,
    }] : [];
    if (firstDueDate) rule.lastPostedDate = firstDueDate;
    const recurring = [...get().recurring, rule];
    const transactions = newTxs.length
      ? [...newTxs, ...get().transactions].sort((a, b) => b.date.localeCompare(a.date))
      : get().transactions;
    await Promise.all([
      storage.set(recKey(uid), recurring),
      newTxs.length ? storage.set(txKey(uid), transactions) : Promise.resolve(),
    ]);
    set({ recurring, transactions });
  },
  deleteRecurring: async (id) => {
    const uid = get().userId;
    if (!uid) return;
    const recurring = get().recurring.filter((r) => r.id !== id);
    await storage.set(recKey(uid), recurring);
    set({ recurring });
  },
}));
