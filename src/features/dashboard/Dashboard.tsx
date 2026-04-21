import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useFinance } from "@/store/finance";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { formatCurrency } from "@/lib/format";
import { WeeklyInsights } from "./WeeklyInsights";

export function Dashboard() {
  const { transactions, categories } = useFinance();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, count: thisMonth.length, monthTx: thisMonth };
  }, [transactions]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    stats.monthTx.filter((t) => t.type === "expense").forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).map(([categoryId, value]) => {
      const cat = categories.find((c) => c.id === categoryId);
      return { name: cat?.name ?? "Other", value, color: `hsl(${cat?.color ?? "186 41% 38%"})` };
    });
  }, [stats.monthTx, categories]);

  const barData = useMemo(() => {
    const months: { label: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleDateString("en-US", { month: "short" }), income: 0, expense: 0 });
    }
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diff >= 0 && diff < 6) {
        const m = months[5 - diff];
        if (t.type === "income") m.income += t.amount;
        else m.expense += t.amount;
      }
    });
    return months;
  }, [transactions]);

  const cards = [
    { label: "Total Income", value: stats.income, icon: ArrowUpRight, accent: "bg-accent text-accent-foreground", iconBg: "bg-success/15 text-success" },
    { label: "Total Expenses", value: stats.expense, icon: ArrowDownRight, accent: "bg-secondary text-secondary-foreground", iconBg: "bg-destructive/15 text-destructive" },
    { label: "Balance", value: stats.balance, icon: Wallet, accent: "bg-gradient-brand text-primary-foreground", iconBg: "bg-primary-foreground/15 text-primary-foreground" },
    { label: "Transactions", value: stats.count, icon: TrendingUp, accent: "bg-card border border-border", iconBg: "bg-primary/10 text-primary", isCount: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl sm:text-4xl font-bold"
        >
          This month at a glance
        </motion.h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-2xl p-5 shadow-elevated card-hover ${c.accent}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm opacity-90">{c.label}</span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold">
                <AnimatedNumber
                  value={c.value}
                  format={c.isCount ? (n) => Math.round(n).toString() : formatCurrency}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-3 rounded-2xl bg-card border border-border p-6 shadow-elevated"
        >
          <h3 className="font-display font-semibold text-lg mb-1">Income vs Expenses</h3>
          <p className="text-sm text-muted-foreground mb-4">Last 6 months</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={6}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                />
                <Bar dataKey="income" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border p-6 shadow-elevated"
        >
          <h3 className="font-display font-semibold text-lg mb-1">Spending breakdown</h3>
          <p className="text-sm text-muted-foreground mb-4">By category, this month</p>
          {pieData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
              No expenses yet this month
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      <WeeklyInsights />
    </div>
  );
}
