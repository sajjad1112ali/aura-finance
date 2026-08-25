import { User, Transaction, Category, RecurringRule } from "@/types";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(res.status, body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface ExtraTransaction {
  id: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

export const api = {
  auth: {
    me: () => request<{ user: User }>("/auth/me"),
    signUp: (data: { name: string; email: string; password: string }) =>
      request<{ user: User }>("/auth/sign-up", { method: "POST", body: JSON.stringify(data) }),
    signIn: (data: { email: string; password: string }) =>
      request<{ user: User }>("/auth/sign-in", { method: "POST", body: JSON.stringify(data) }),
    signOut: () => request<{ ok: true }>("/auth/sign-out", { method: "POST" }),
  },
  transactions: {
    list: () => request<Transaction[]>("/transactions"),
    create: (t: Omit<Transaction, "id" | "createdAt">) =>
      request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(t) }),
    update: (id: string, patch: Partial<Transaction>) =>
      request<Transaction>(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) =>
      request<{ ok: true }>(`/transactions/${id}`, { method: "DELETE" }),
    migrate: (items: Transaction[]) =>
      request<{ inserted: number }>("/transactions/migrate", { method: "POST", body: JSON.stringify(items) }),
  },
  categories: {
    list: () => request<Category[]>("/categories"),
    create: (c: Omit<Category, "id" | "isCustom">) =>
      request<Category>("/categories", { method: "POST", body: JSON.stringify(c) }),
    update: (id: string, patch: Partial<Category>) =>
      request<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) =>
      request<{ ok: true }>(`/categories/${id}`, { method: "DELETE" }),
    migrate: (items: Category[]) =>
      request<{ inserted: number }>("/categories/migrate", { method: "POST", body: JSON.stringify(items) }),
  },
  recurring: {
    list: () => request<RecurringRule[]>("/recurring"),
    create: (r: Omit<RecurringRule, "id" | "createdAt" | "lastPostedDate">) =>
      request<RecurringRule>("/recurring", { method: "POST", body: JSON.stringify(r) }),
    update: (id: string, patch: Partial<RecurringRule>) =>
      request<RecurringRule>(`/recurring/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) =>
      request<{ ok: true }>(`/recurring/${id}`, { method: "DELETE" }),
    migrate: (items: RecurringRule[]) =>
      request<{ inserted: number }>("/recurring/migrate", { method: "POST", body: JSON.stringify(items) }),
  },
  extra: {
    list: () => request<ExtraTransaction[]>("/extra"),
    create: (e: { amount: number; date: string; notes?: string }) =>
      request<ExtraTransaction>("/extra", { method: "POST", body: JSON.stringify(e) }),
    update: (id: string, patch: { amount: number; date: string; notes?: string }) =>
      request<ExtraTransaction>(`/extra/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) =>
      request<{ ok: true }>(`/extra/${id}`, { method: "DELETE" }),
    migrate: (items: ExtraTransaction[]) =>
      request<{ inserted: number }>("/extra/migrate", { method: "POST", body: JSON.stringify(items) }),
  },
};
