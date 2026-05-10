import { create } from "zustand";

/**
 * Isolated store for "Extra Transactions".
 * Intentionally independent from the main finance store — these entries
 * never affect dashboard analytics, balances, or summaries.
 */
export interface ExtraTransaction {
  id: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  createdAt: string;
}

const STORAGE_KEY = "et.extraTransactions";
const keyFor = (uid: string) => `${STORAGE_KEY}.${uid}`;

const read = (uid: string): ExtraTransaction[] => {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    return raw ? (JSON.parse(raw) as ExtraTransaction[]) : [];
  } catch {
    return [];
  }
};

const write = (uid: string, items: ExtraTransaction[]) => {
  localStorage.setItem(keyFor(uid), JSON.stringify(items));
};

interface ExtraState {
  userId: string | null;
  items: ExtraTransaction[];
  loaded: boolean;
  load: (userId: string) => void;
  reset: () => void;
  add: (input: { amount: number; date: string }) => void;
  update: (id: string, patch: { amount: number; date: string }) => void;
  remove: (id: string) => void;
}

export const useExtra = create<ExtraState>((set, get) => ({
  userId: null,
  items: [],
  loaded: false,
  load: (userId) => {
    if (get().userId === userId && get().loaded) return;
    const items = read(userId).sort((a, b) => b.date.localeCompare(a.date));
    set({ userId, items, loaded: true });
  },
  reset: () => set({ userId: null, items: [], loaded: false }),
  add: ({ amount, date }) => {
    const uid = get().userId;
    if (!uid) return;
    const tx: ExtraTransaction = {
      id: crypto.randomUUID(),
      amount,
      date,
      createdAt: new Date().toISOString(),
    };
    const items = [tx, ...get().items].sort((a, b) => b.date.localeCompare(a.date));
    write(uid, items);
    set({ items });
  },
  update: (id, patch) => {
    const uid = get().userId;
    if (!uid) return;
    const items = get()
      .items.map((t) => (t.id === id ? { ...t, ...patch } : t))
      .sort((a, b) => b.date.localeCompare(a.date));
    write(uid, items);
    set({ items });
  },
  remove: (id) => {
    const uid = get().userId;
    if (!uid) return;
    const items = get().items.filter((t) => t.id !== id);
    write(uid, items);
    set({ items });
  },
}));