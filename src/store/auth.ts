import { create } from "zustand";
import { api } from "@/services/api";
import { migrateLocalStorageToApi } from "@/services/migrate";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  initialized: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  init: async () => {
    try {
      const { user } = await api.auth.me();
      set({ user, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },
  signIn: async (email, password) => {
    const { user } = await api.auth.signIn({ email, password });
    set({ user });
    await migrateLocalStorageToApi(user.id);
  },
  signUp: async (name, email, password) => {
    const { user } = await api.auth.signUp({ name, email, password });
    set({ user });
  },
  signOut: async () => {
    await api.auth.signOut();
    set({ user: null });
  },
}));
