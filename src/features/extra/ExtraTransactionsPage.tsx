import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { ExtraTransaction, useExtra } from "./extraStore";
import { ExtraTransactionForm } from "./ExtraTransactionForm";
import { toast } from "sonner";

export function ExtraTransactionsPage() {
  const user = useAuth((s) => s.user);
  const { items, load, reset, remove } = useExtra();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExtraTransaction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ExtraTransaction | null>(null);

  useEffect(() => {
    if (user) load(user.id);
    else reset();
  }, [user, load, reset]);

  const total = useMemo(() => items.reduce((sum, t) => sum + t.amount, 0), [items]);

  const dialogOpen = open || !!editing;
  const handleDialogChange = (o: boolean) => {
    if (!o) { setOpen(false); setEditing(null); }
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    remove(confirmDelete.id);
    toast.success("Extra transaction deleted");
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Extra Transactions</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "entry" : "entries"} · {formatCurrency(total)} total
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Isolated from your dashboard, balances, and main transactions.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => { setEditing(null); setOpen(true); }}
              className="h-11 bg-gradient-brand text-primary-foreground font-semibold shadow-glow hover:opacity-95"
            >
              <Plus className="h-4 w-4 mr-2" /> Add extra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {editing ? "Edit extra transaction" : "New extra transaction"}
              </DialogTitle>
            </DialogHeader>
            <ExtraTransactionForm
              key={editing?.id ?? "new"}
              transaction={editing ?? undefined}
              onDone={() => handleDialogChange(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
        {items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg">No extra transactions</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Add your first entry — it stays isolated from your main finances.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {items.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">Extra entry</div>
                    <div className="text-xs text-muted-foreground">{formatDate(t.date)}</div>
                  </div>
                  <div className="font-display font-bold text-lg">{formatCurrency(t.amount)}</div>
                  <button
                    onClick={() => setEditing(t)}
                    className="opacity-60 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(t)}
                    className="opacity-60 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete extra transaction?"
        description={
          confirmDelete
            ? `This entry (${formatCurrency(confirmDelete.amount)}) will be permanently removed.`
            : ""
        }
        onConfirm={doDelete}
      />
    </div>
  );
}