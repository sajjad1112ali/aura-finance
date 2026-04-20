import { create } from "zustand";

interface ExportScopeState {
  /** IDs of currently filtered transactions, or null when no filters are active. */
  filteredIds: string[] | null;
  setFilteredIds: (ids: string[] | null) => void;
}

export const useExportScope = create<ExportScopeState>((set) => ({
  filteredIds: null,
  setFilteredIds: (ids) => set({ filteredIds: ids }),
}));
