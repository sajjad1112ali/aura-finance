/**
 * Storage abstraction. Swap LocalStorageAdapter for ApiAdapter later
 * without touching feature code.
 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }
  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter();

export const STORAGE_KEYS = {
  user: "et.auth.user",
  users: "et.auth.users",
  transactions: "et.transactions",
  categories: "et.categories",
  theme: "et.theme",
} as const;
