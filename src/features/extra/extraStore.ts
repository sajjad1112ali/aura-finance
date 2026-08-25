import { create } from "zustand";
import { api, ExtraTransaction } from "@/services/api";

export type { ExtraTransaction };

interface ExtraState {
  userId: string | null;
  items: ExtraTransaction[];
  loaded: boolean;
  load: (userId: string) => Promise<void>;
  reset: () => void;
  add: (input: { amount: number; date: string; notes?: string }) => Promise<void>;
  update: (id: string, patch: { amount: number; date: string; notes?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useExtra = create<ExtraState>((set, get) => ({
  userId: null,
  items: [],
  loaded: false,
  load: async (userId) => {
    if (get().userId === userId && get().loaded) return;
    const items = (await api.extra.list()).sort((a, b) => b.date.localeCompare(a.date));
    set({ userId, items, loaded: true });
  },
  reset: () => set({ userId: null, items: [], loaded: false }),
  add: async ({ amount, date, notes }) => {
    const tx = await api.extra.create({ amount, date, notes });
    const items = [tx, ...get().items].sort((a, b) => b.date.localeCompare(a.date));
    set({ items });
  },
  update: async (id, patch) => {
    const tx = await api.extra.update(id, patch);
    const items = get()
      .items.map((t) => (t.id === id ? tx : t))
      .sort((a, b) => b.date.localeCompare(a.date));
    set({ items });
  },
  remove: async (id) => {
    await api.extra.delete(id);
    const items = get().items.filter((t) => t.id !== id);
    set({ items });
  },
}));
