import { create } from "zustand";
import { api } from "@/services/api";
import { Category, RecurringRule, Transaction } from "@/types";
import { monthRange, shiftMonth } from "@/lib/range";

interface FinanceState {
  userId: string | null;
  transactions: Transaction[];
  viewRange: { from?: string; to?: string } | null;
  categories: Category[];
  recurring: RecurringRule[];
  loaded: boolean;
  version: number;
  load: (userId: string) => Promise<void>;
  setRange: (from?: string, to?: string) => Promise<void>;
  refreshActiveRange: () => Promise<void>;
  fetchRange: (from?: string, to?: string) => Promise<Transaction[]>;
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

const WINDOW_MONTHS = 6;

let loadingFor: string | null = null;

export const useFinance = create<FinanceState>((set, get) => ({
  userId: null,
  transactions: [],
  viewRange: null,
  categories: [],
  recurring: [],
  loaded: false,
  version: 0,
  load: async (userId) => {
    if (loadingFor === userId) return;
    const state = get();
    if (state.loaded && state.userId === userId) return;
    loadingFor = userId;
    set({ loaded: false, userId });
    try {
      await Promise.all([
        api.categories.list(),
        api.recurring.list(),
        api.recurring.process(),
      ]).then(([categories, rules]) => {
        set({ categories, recurring: rules });
      });

      const now = new Date();
      const from = monthRange(shiftMonth(now, -(WINDOW_MONTHS - 1))).from;
      const to = monthRange(now).to;
      const transactions = await api.transactions.list({ from, to });

      set({ transactions, viewRange: { from, to }, loaded: true, version: get().version + 1 });
    } finally {
      if (loadingFor === userId) loadingFor = null;
    }
  },
  setRange: async (from, to) => {
    const cur = get().viewRange;
    if (cur?.from === from && cur?.to === to) return;
    const transactions = await api.transactions.list({ from, to });
    set({ transactions, viewRange: { from, to } });
  },
  refreshActiveRange: async () => {
    const { from, to } = get().viewRange ?? {};
    const transactions = await api.transactions.list({ from, to });
    set({ transactions });
  },
  fetchRange: (from, to) => api.transactions.list({ from, to }),
  reset: () => {
    loadingFor = null;
    set({ userId: null, transactions: [], viewRange: null, categories: [], recurring: [], loaded: false, version: 0 });
  },
  addTransaction: async (t) => {
    await api.transactions.create(t);
    await get().refreshActiveRange();
    set({ version: get().version + 1 });
  },
  updateTransaction: async (id, patch) => {
    await api.transactions.update(id, patch);
    await get().refreshActiveRange();
    set({ version: get().version + 1 });
  },
  deleteTransaction: async (id) => {
    await api.transactions.delete(id);
    await get().refreshActiveRange();
    set({ version: get().version + 1 });
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
    const recurring = [...get().recurring, rule];
    set({ recurring });
    await get().refreshActiveRange();
    set({ version: get().version + 1 });
  },
  updateRecurring: async (id, patch) => {
    const rule = await api.recurring.update(id, patch);
    const recurring = get().recurring.map((r) => (r.id === id ? rule : r));
    set({ recurring });
  },
  deleteRecurring: async (id) => {
    await api.recurring.delete(id);
    const recurring = get().recurring.filter((r) => r.id !== id);
    set({ recurring });
  },
}));