import { create } from "zustand";
import { storage, STORAGE_KEYS } from "@/services/storage";
import { DEFAULT_CATEGORIES } from "@/services/seed";
import { Category, Transaction } from "@/types";

interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  loaded: boolean;
  load: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, "id" | "isCustom">) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useFinance = create<FinanceState>((set, get) => ({
  transactions: [],
  categories: [],
  loaded: false,
  load: async () => {
    const [t, c] = await Promise.all([
      storage.get<Transaction[]>(STORAGE_KEYS.transactions),
      storage.get<Category[]>(STORAGE_KEYS.categories),
    ]);
    const categories = c && c.length ? c : DEFAULT_CATEGORIES;
    if (!c) await storage.set(STORAGE_KEYS.categories, categories);
    set({ transactions: t ?? [], categories, loaded: true });
  },
  addTransaction: async (t) => {
    const tx: Transaction = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const transactions = [tx, ...get().transactions];
    await storage.set(STORAGE_KEYS.transactions, transactions);
    set({ transactions });
  },
  deleteTransaction: async (id) => {
    const transactions = get().transactions.filter((t) => t.id !== id);
    await storage.set(STORAGE_KEYS.transactions, transactions);
    set({ transactions });
  },
  addCategory: async (c) => {
    const cat: Category = { ...c, id: crypto.randomUUID(), isCustom: true };
    const categories = [...get().categories, cat];
    await storage.set(STORAGE_KEYS.categories, categories);
    set({ categories });
  },
  updateCategory: async (id, patch) => {
    const categories = get().categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
    await storage.set(STORAGE_KEYS.categories, categories);
    set({ categories });
  },
  deleteCategory: async (id) => {
    const categories = get().categories.filter((c) => c.id !== id);
    await storage.set(STORAGE_KEYS.categories, categories);
    set({ categories });
  },
}));
