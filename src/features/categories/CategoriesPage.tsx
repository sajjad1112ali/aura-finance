import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useFinance } from "@/store/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Category, TransactionType } from "@/types";
import { toast } from "sonner";

const ICON_OPTIONS = ["UtensilsCrossed", "Receipt", "Car", "ShoppingBag", "Film", "HeartPulse", "Briefcase", "Laptop", "TrendingUp", "Sparkles", "Plane", "Home", "BookOpen", "Gift", "Coffee", "Dumbbell"];
const COLOR_OPTIONS = ["6 78% 57%", "35 90% 55%", "220 70% 55%", "300 60% 55%", "270 60% 60%", "340 70% 55%", "152 45% 45%", "186 41% 38%", "186 33% 47%", "160 50% 40%"];

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, transactions } = useFinance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", icon: "Sparkles", color: COLOR_OPTIONS[0], type: "expense" as TransactionType | "both" });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", icon: "Sparkles", color: COLOR_OPTIONS[0], type: "expense" });
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, icon: c.icon, color: c.color, type: c.type });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (editing) {
      await updateCategory(editing.id, form);
      toast.success("Category updated");
    } else {
      await addCategory(form);
      toast.success("Category added");
    }
    setOpen(false);
  };

  const handleDelete = async (c: Category) => {
    const inUse = transactions.some((t) => t.categoryId === c.id);
    if (inUse) return toast.error("Category is in use by transactions");
    await deleteCategory(c.id);
    toast.success("Category deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize transactions your way</p>
        </div>
        <Button onClick={openNew} className="h-11 bg-gradient-brand text-primary-foreground font-semibold shadow-glow hover:opacity-95">
          <Plus className="h-4 w-4 mr-2" /> New category
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <AnimatePresence>
          {categories.map((c, i) => {
            const Icon = (Icons as any)[c.icon] || Icons.Circle;
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-2xl bg-card border border-border p-4 shadow-soft card-hover group relative"
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `hsl(${c.color} / 0.15)`, color: `hsl(${c.color})` }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground capitalize mt-0.5">{c.type}</div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="h-7 w-7 rounded-md bg-muted hover:bg-secondary flex items-center justify-center" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {c.isCustom && (
                    <button onClick={() => handleDelete(c)} className="h-7 w-7 rounded-md bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Groceries" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-2">
                {ICON_OPTIONS.map((name) => {
                  const Icon = (Icons as any)[name];
                  const active = form.icon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setForm({ ...form, icon: name })}
                      className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${active ? "bg-primary text-primary-foreground scale-105 shadow-soft" : "bg-muted hover:bg-secondary"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => {
                  const active = form.color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-9 w-9 rounded-full transition-transform ${active ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110" : "hover:scale-105"}`}
                      style={{ background: `hsl(${c})` }}
                    />
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-gradient-brand text-primary-foreground font-semibold shadow-glow hover:opacity-95">
              {editing ? "Save changes" : "Create category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
