import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/store/finance";
import { Transaction, TransactionType } from "@/types";
import { toast } from "sonner";

interface Props {
  onDone?: () => void;
  transaction?: Transaction;
}

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionForm({ onDone, transaction }: Props) {
  const { categories, addTransaction, updateTransaction } = useFinance();
  const isEdit = !!transaction;
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [date, setDate] = useState(transaction?.date ?? today());
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<"close" | "new">("close");

  const filteredCats = categories.filter((c) => c.type === type || c.type === "both");
  const maxDate = today();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!categoryId) return toast.error("Pick a category");
    if (date > maxDate) return toast.error("Date cannot be in the future");
    setSubmitting(true);
    try {
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, { amount: amt, type, categoryId, date, description });
        toast.success("Transaction updated");
        onDone?.();
      } else {
        await addTransaction({ amount: amt, type, categoryId, date, description });
        toast.success(`${type === "income" ? "Income" : "Expense"} added`);
        // Always clear amount + description so the next entry starts fresh,
        // but keep type, category, and date so similar/backdated entries are quick.
        setAmount("");
        setDescription("");
        if (submitMode === "close") {
          onDone?.();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="relative grid grid-cols-2 p-1 rounded-full bg-muted">
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); if (!isEdit) setCategoryId(""); }}
            className="relative py-2 text-sm font-medium z-10"
          >
            {type === t && (
              <motion.span
                layoutId="tx-type-pill"
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

      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
          <Input
            type="number" step="0.01" min="0" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className="h-14 pl-8 text-2xl font-display font-bold"
            required
          />
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
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?" rows={2} className="resize-none"
        />
      </div>

      {isEdit ? (
        <Button
          type="submit"
          disabled={submitting}
          onClick={() => setSubmitMode("close")}
          className="w-full h-11 bg-gradient-brand text-primary-foreground font-semibold shadow-glow hover:opacity-95"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="submit"
            disabled={submitting}
            variant="outline"
            onClick={() => setSubmitMode("new")}
            className="h-11 font-semibold"
          >
            {submitting && submitMode === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add & New"}
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            onClick={() => setSubmitMode("close")}
            className="h-11 bg-gradient-brand text-primary-foreground font-semibold shadow-glow hover:opacity-95"
          >
            {submitting && submitMode === "close" ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add ${type}`}
          </Button>
        </div>
      )}
    </form>
  );
}
