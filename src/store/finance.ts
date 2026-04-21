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
  deleteRecurring: (id: string) => Promise<void>;
}

const txKey = (uid: string) => `${STORAGE_KEYS.transactions}.${uid}`;
const catKey = (uid: string) => `${STORAGE_KEYS.categories}.${uid}`;
const recKey = (uid: string) => `${STORAGE_KEYS.recurring}.${uid}`;

export const useFinance = create<FinanceState>((set, get) => ({
  userId: null,
  transactions: [],
  categories: [],
  recurring: [],
  loaded: false,
  load: async (userId) => {
    set({ loaded: false, userId });
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
    const newTxs: Transaction[] = [];
    rules = rules.map((rule) => {
      const dates = dueOccurrences(rule.startDate, rule.frequency, rule.lastPostedDate, today);
      if (!dates.length) return rule;
      for (const d of dates) {
        newTxs.push({
          id: crypto.randomUUID(),
          amount: rule.amount,
          type: rule.type,
          categoryId: rule.categoryId,
          date: d,
          description: rule.description,
          createdAt: new Date().toISOString(),
        });
      }
      return { ...rule, lastPostedDate: dates[dates.length - 1] };
    });
    if (newTxs.length) {
      transactions = [...newTxs, ...transactions].sort((a, b) => b.date.localeCompare(a.date));
      await storage.set(txKey(userId), transactions);
      await storage.set(recKey(userId), rules);
    }

    set({ transactions, categories, recurring: rules, loaded: true });
  },
  reset: () => set({ userId: null, transactions: [], categories: [], recurring: [], loaded: false }),
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
    // Immediately post any occurrences from startDate up to today
    const today = todayISO();
    const dates = dueOccurrences(rule.startDate, rule.frequency, undefined, today);
    const newTxs: Transaction[] = dates.map((d) => ({
      id: crypto.randomUUID(),
      amount: rule.amount,
      type: rule.type,
      categoryId: rule.categoryId,
      date: d,
      description: rule.description,
      createdAt: new Date().toISOString(),
    }));
    if (dates.length) rule.lastPostedDate = dates[dates.length - 1];
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
