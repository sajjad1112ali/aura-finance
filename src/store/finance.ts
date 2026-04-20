import { create } from "zustand";
import { storage, STORAGE_KEYS } from "@/services/storage";
import { DEFAULT_CATEGORIES } from "@/services/seed";
import { Category, Transaction } from "@/types";

interface FinanceState {
  userId: string | null;
  transactions: Transaction[];
  categories: Category[];
  loaded: boolean;
  load: (userId: string) => Promise<void>;
  reset: () => void;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, "id" | "createdAt">>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, "id" | "isCustom">) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const txKey = (uid: string) => `${STORAGE_KEYS.transactions}.${uid}`;
const catKey = (uid: string) => `${STORAGE_KEYS.categories}.${uid}`;

export const useFinance = create<FinanceState>((set, get) => ({
  userId: null,
  transactions: [],
  categories: [],
  loaded: false,
  load: async (userId) => {
    set({ loaded: false, userId });
    const [t, c] = await Promise.all([
      storage.get<Transaction[]>(txKey(userId)),
      storage.get<Category[]>(catKey(userId)),
    ]);
    const categories = c && c.length ? c : DEFAULT_CATEGORIES;
    if (!c) await storage.set(catKey(userId), categories);
    set({ transactions: t ?? [], categories, loaded: true });
  },
  reset: () => set({ userId: null, transactions: [], categories: [], loaded: false }),
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
}));
