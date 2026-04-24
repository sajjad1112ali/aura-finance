import { create } from "zustand";

export interface TransactionPrefill {
  from?: string;
  to?: string;
  categoryId?: string;
}

interface NavigationState {
  /** Pending tab to switch to (consumed by Index). */
  pendingTab: "dashboard" | "transactions" | "categories" | null;
  /** Pending filter prefill for the Transactions page. */
  transactionsPrefill: TransactionPrefill | null;
  goToTransactions: (prefill?: TransactionPrefill) => void;
  consumePendingTab: () => void;
  consumeTransactionsPrefill: () => TransactionPrefill | null;
}

export const useNavigation = create<NavigationState>((set, get) => ({
  pendingTab: null,
  transactionsPrefill: null,
  goToTransactions: (prefill) =>
    set({ pendingTab: "transactions", transactionsPrefill: prefill ?? null }),
  consumePendingTab: () => set({ pendingTab: null }),
  consumeTransactionsPrefill: () => {
    const p = get().transactionsPrefill;
    set({ transactionsPrefill: null });
    return p;
  },
}));