import { create } from "zustand";
import { storage, STORAGE_KEYS } from "@/services/storage";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  init: () => Promise<void>;
  toggle: () => Promise<void>;
}

const apply = (t: Theme) => {
  document.documentElement.classList.toggle("dark", t === "dark");
};

export const useTheme = create<ThemeState>((set, get) => ({
  theme: "light",
  init: async () => {
    const stored = (await storage.get<Theme>(STORAGE_KEYS.theme)) ?? "light";
    apply(stored);
    set({ theme: stored });
  },
  toggle: async () => {
    const next: Theme = get().theme === "light" ? "dark" : "light";
    apply(next);
    await storage.set(STORAGE_KEYS.theme, next);
    set({ theme: next });
  },
}));
