import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { Repeat, Plus, Trash2, Loader2, CalendarClock } from "lucide-react";
import { Pencil, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useFinance } from "@/store/finance";
import { RecurringFrequency, RecurringRule, TransactionType } from "@/types";
import { todayISO } from "@/lib/recurring";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function RecurringDialog({ open, onOpenChange }: Props) {
  const { categories, recurring, addRecurring, updateRecurring, deleteRecurring } = useFinance();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [startDate, setStartDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<RecurringRule | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredCats = categories.filter((c) => c.type === type || c.type === "both");
  const maxDate = todayISO();

  const reset = () => {
    setAmount(""); setDescription(""); setCategoryId("");
    setFrequency("monthly"); setStartDate(todayISO()); setType("expense");
    setEditingId(null);
  };

  const startEdit = (r: RecurringRule) => {
    setEditingId(r.id);
    setType(r.type);
    setAmount(String(r.amount));
    setCategoryId(r.categoryId);
    setDescription(r.description);
    setFrequency(r.frequency);
    setStartDate(r.startDate);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!categoryId) return toast.error("Pick a category");
    if (startDate > maxDate) return toast.error("Start date cannot be in the future");
    setSubmitting(true);
    try {
      if (editingId) {
        await updateRecurring(editingId, { amount: amt, type, categoryId, description, frequency, startDate });
        toast.success("Recurring rule updated. Future transactions will use the new values.");
      } else {
        await addRecurring({ amount: amt, type, categoryId, description, frequency, startDate });
        toast.success("Recurring transaction scheduled");
      }
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteRecurring(confirmDelete.id);
    toast.success("Recurring rule removed");
    setConfirmDelete(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" />
              Recurring transactions
            </DialogTitle>
            <DialogDescription>
              Schedule transactions that auto-post on a daily, weekly, or monthly basis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="relative grid grid-cols-2 p-1 rounded-full bg-background">
              {(["expense", "income"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setCategoryId(""); }}
                  className="relative py-2 text-sm font-medium z-10"
                >
                  {type === t && (
                    <motion.span
                      layoutId="rec-type-pill"
                      className={`absolute inset-0 rounded-full shadow-soft ${t === "income" ? "bg-success" : "bg-destructive"}`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className={`relative capitalize ${type === t ? "text-primary-foreground" : "text-muted-foreground"}`}>
                    {t}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="h-11 pl-7 font-medium" required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v: RecurringFrequency) => setFrequency(v)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Choose" /></SelectTrigger>
                  <SelectContent>
                    {filteredCats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${c.color})` }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input
                  type="date" value={startDate} max={maxDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11" required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Daily milk, Netflix subscription"
                rows={2} className="resize-none"
              />
            </div>

            <Button
              type="submit" disabled={submitting}
              className="w-full h-11 bg-gradient-brand text-primary-foreground font-semibold shadow-glow hover:opacity-95"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Schedule recurring</>}
            </Button>
          </form>

          <div className="space-y-2">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide px-1">
              Active rules ({recurring.length})
            </h3>
            {recurring.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-border">
                <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recurring transactions yet</p>
              </div>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {recurring.map((r) => {
                    const cat = categories.find((c) => c.id === r.categoryId);
                    const Icon = (cat?.icon && (Icons as any)[cat.icon]) || Icons.Circle;
                    const isIncome = r.type === "income";
                    return (
                      <motion.li
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 8, height: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                      >
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `hsl(${cat?.color ?? "186 41% 38%"} / 0.15)`, color: `hsl(${cat?.color ?? "186 41% 38%"})` }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{r.description || cat?.name || "Recurring"}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{cat?.name}</span>
                            <span>•</span>
                            <span>{FREQ_LABEL[r.frequency]}</span>
                            <span>•</span>
                            <span>from {formatDate(r.startDate)}</span>
                          </div>
                        </div>
                        <div className={`font-display font-bold ${isIncome ? "text-success" : "text-destructive"}`}>
                          {isIncome ? "+" : "−"}{formatCurrency(r.amount)}
                        </div>
                        <button
                          onClick={() => setConfirmDelete(r)}
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete recurring rule?"
        description="Future occurrences will no longer be auto-posted. Already-posted transactions will remain in your history."
        onConfirm={handleDelete}
      />
    </>
  );
}