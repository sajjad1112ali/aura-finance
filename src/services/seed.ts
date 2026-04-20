import { Category } from "@/types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-food", name: "Food & Dining", icon: "UtensilsCrossed", color: "6 78% 57%", type: "expense" },
  { id: "cat-bills", name: "Bills & Utilities", icon: "Receipt", color: "35 90% 55%", type: "expense" },
  { id: "cat-transport", name: "Transport", icon: "Car", color: "220 70% 55%", type: "expense" },
  { id: "cat-shopping", name: "Shopping", icon: "ShoppingBag", color: "300 60% 55%", type: "expense" },
  { id: "cat-entertainment", name: "Entertainment", icon: "Film", color: "270 60% 60%", type: "expense" },
  { id: "cat-health", name: "Health", icon: "HeartPulse", color: "340 70% 55%", type: "expense" },
  { id: "cat-salary", name: "Salary", icon: "Briefcase", color: "152 45% 45%", type: "income" },
  { id: "cat-freelance", name: "Freelance", icon: "Laptop", color: "186 41% 38%", type: "income" },
  { id: "cat-investments", name: "Investments", icon: "TrendingUp", color: "186 33% 47%", type: "income" },
  { id: "cat-other", name: "Other", icon: "Sparkles", color: "186 20% 50%", type: "both" },
];
