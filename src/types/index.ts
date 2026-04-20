export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // hsl token e.g. "186 41% 38%"
  type: TransactionType | "both";
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO date
  description: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
