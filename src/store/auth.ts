import { create } from "zustand";
import { storage, STORAGE_KEYS } from "@/services/storage";
import { User } from "@/types";

interface StoredUser extends User {
  password: string;
}

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
    const user = await storage.get<User>(STORAGE_KEYS.user);
    set({ user, initialized: true });
  },
  signIn: async (email, password) => {
    const users = (await storage.get<StoredUser[]>(STORAGE_KEYS.users)) ?? [];
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) throw new Error("Invalid email or password");
    const { password: _p, ...user } = found;
    await storage.set(STORAGE_KEYS.user, user);
    set({ user });
  },
  signUp: async (name, email, password) => {
    const users = (await storage.get<StoredUser[]>(STORAGE_KEYS.users)) ?? [];
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists");
    }
    const newUser: StoredUser = { id: crypto.randomUUID(), name, email, password };
    users.push(newUser);
    await storage.set(STORAGE_KEYS.users, users);
    const { password: _p, ...user } = newUser;
    await storage.set(STORAGE_KEYS.user, user);
    set({ user });
  },
  signOut: async () => {
    await storage.remove(STORAGE_KEYS.user);
    set({ user: null });
  },
}));
