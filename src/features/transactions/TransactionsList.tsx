import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { Plus, Search, Trash2, Filter, X, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useFinance } from "@/store/finance";
import { useExportScope } from "@/store/exportScope";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";
import { formatCurrency, formatDate } from "@/lib/format";
import { Transaction } from "@/types";

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
type PageSize = 10 | 20 | 50 | 100 | "all";

function getPageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "ellipsis")[] = [];
  const showLeftDots = current > 4;
  const showRightDots = current < total - 3;
  items.push(1);
  if (showLeftDots) items.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) items.push(i);
  if (showRightDots) items.push("ellipsis");
  items.push(total);
  return items;
}

export function TransactionsList() {
  const { transactions, categories, deleteTransaction } = useFinance();
  const setFilteredIds = useExportScope((s) => s.setFilteredIds);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");

  const hasFilters = !!(search || categoryFilter !== "all" || typeFilter !== "all" || from || to);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        return (
          t.description.toLowerCase().includes(q) ||
          cat?.name.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
        );
      });
    }
    if (categoryFilter !== "all") list = list.filter((t) => t.categoryId === categoryFilter);
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (from) list = list.filter((t) => t.date >= from);
    if (to) list = list.filter((t) => t.date <= to);

    list.sort((a, b) => {
      switch (sort) {
        case "date-asc": return a.date.localeCompare(b.date);
        case "amount-desc": return b.amount - a.amount;
        case "amount-asc": return a.amount - b.amount;
        default: return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [transactions, categories, search, categoryFilter, typeFilter, from, to, sort]);

  // Publish current filter scope so global Export uses it
  useEffect(() => {
    setFilteredIds(hasFilters ? filtered.map((t) => t.id) : null);
    return () => setFilteredIds(null);
  }, [filtered, hasFilters, setFilteredIds]);

  const clearFilters = () => {
    setSearch(""); setCategoryFilter("all"); setTypeFilter("all"); setFrom(""); setTo(""); setSort("date-desc");
  };

  const dialogOpen = open || !!editing;
  const handleDialogChange = (o: boolean) => {
    if (!o) { setOpen(false); setEditing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} of {transactions.length} entries</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => { setEditing(null); setOpen(true); }}
              className="h-11 bg-gradient-brand text-primary-foreground font-semibold shadow-glow hover:opacity-95"
            >
              <Plus className="h-4 w-4 mr-2" /> Add transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {editing ? "Edit transaction" : "New transaction"}
              </DialogTitle>
            </DialogHeader>
            <TransactionForm
              key={editing?.id ?? "new"}
              transaction={editing ?? undefined}
              onDone={() => handleDialogChange(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 h-10" />
          </div>
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger className="w-32 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40 h-10" title="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40 h-10" title="To" />
          <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
            <SelectTrigger className="w-44 h-10"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest first</SelectItem>
              <SelectItem value="date-asc">Oldest first</SelectItem>
              <SelectItem value="amount-desc">Amount: high → low</SelectItem>
              <SelectItem value="amount-asc">Amount: low → high</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg">No transactions</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {transactions.length === 0 ? "Add your first transaction to get started." : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {filtered.map((t) => (
                <TransactionRow
                  key={t.id}
                  t={t}
                  onDelete={deleteTransaction}
                  onEdit={() => setEditing(t)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

function TransactionRow({
  t,
  onDelete,
  onEdit,
}: {
  t: Transaction;
  onDelete: (id: string) => void;
  onEdit: () => void;
}) {
  const { categories } = useFinance();
  const cat = categories.find((c) => c.id === t.categoryId);
  const Icon = (cat?.icon && (Icons as any)[cat.icon]) || Icons.Circle;
  const isIncome = t.type === "income";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group"
    >
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `hsl(${cat?.color ?? "186 41% 38%"} / 0.15)`, color: `hsl(${cat?.color ?? "186 41% 38%"})` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{t.description || cat?.name || "Transaction"}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{cat?.name}</span>
          <span>•</span>
          <span>{formatDate(t.date)}</span>
        </div>
      </div>
      <div className={`font-display font-bold text-lg ${isIncome ? "text-success" : "text-destructive"}`}>
        {isIncome ? "+" : "−"}{formatCurrency(t.amount)}
      </div>
      <button
        onClick={onEdit}
        className="opacity-60 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => onDelete(t.id)}
        className="opacity-60 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.li>
  );
}
