import { api } from "./api";
import { Transaction, Category, RecurringRule } from "@/types";
import { ExtraTransaction } from "./api";

const MIGRATION_FLAG = "et.migrated_to_turso";

export function isMigrated(): boolean {
  return localStorage.getItem(MIGRATION_FLAG) === "true";
}

export async function migrateLocalStorageToApi(userId: string): Promise<void> {
  if (isMigrated()) return;

  const oldTransactions = parseJson<Transaction[]>(`et.transactions.${userId}`);
  const oldCategories = parseJson<Category[]>(`et.categories.${userId}`);
  const oldRecurring = parseJson<RecurringRule[]>(`et.recurring.${userId}`);
  const oldExtra = parseJson<ExtraTransaction[]>(`et.extraTransactions.${userId}`);

  const hasData = oldTransactions.length || oldCategories.length || oldRecurring.length || oldExtra.length;
  if (!hasData) {
    localStorage.setItem(MIGRATION_FLAG, "true");
    return;
  }

  if (oldCategories.length) await api.categories.migrate(oldCategories);
  if (oldTransactions.length) await api.transactions.migrate(oldTransactions);
  if (oldRecurring.length) await api.recurring.migrate(oldRecurring);
  if (oldExtra.length) await api.extra.migrate(oldExtra);

  localStorage.removeItem(`et.transactions.${userId}`);
  localStorage.removeItem(`et.categories.${userId}`);
  localStorage.removeItem(`et.recurring.${userId}`);
  localStorage.removeItem(`et.extraTransactions.${userId}`);
  localStorage.removeItem("et.auth.user");
  localStorage.removeItem("et.auth.users");
  localStorage.setItem(MIGRATION_FLAG, "true");
}

function parseJson<T>(key: string): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ([] as unknown as T);
  } catch {
    return [] as unknown as T;
  }
}
