import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExtraTransaction, useExtra } from "./extraStore";

interface Props {
  onDone?: () => void;
  transaction?: ExtraTransaction;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ExtraTransactionForm({ onDone, transaction }: Props) {
  const { add, update } = useExtra();
  const isEdit = !!transaction;
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [date, setDate] = useState(transaction?.date ?? today());
  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<"close" | "new">("close");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!date) return toast.error("Pick a date");
    setSubmitting(true);
    try {
      if (isEdit && transaction) {
        update(transaction.id, { amount: amt, date });
        toast.success("Extra transaction updated");
        onDone?.();
      } else {
        add({ amount: amt, date });
        toast.success("Extra transaction added");
        setAmount("");
        if (submitMode === "close") onDone?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
          <Input
            type="number" step="0.01" min="0" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className="h-14 pl-8 text-2xl font-display font-bold"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11"
          required
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
            {submitting && submitMode === "close" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>
      )}
    </form>
  );
}