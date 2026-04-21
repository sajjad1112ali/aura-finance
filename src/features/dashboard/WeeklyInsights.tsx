import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingDown, TrendingUp, Trophy, Coffee, CalendarDays } from "lucide-react";
import { useFinance } from "@/store/finance";
import { formatCurrency } from "@/lib/format";

type Insight = {
  id: string;
  icon: typeof Sparkles;
  title: string;
  body: string;
  tone: "positive" | "negative" | "neutral";
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysAgo = (n: number) => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
};

export function WeeklyInsights() {
  const { transactions, categories } = useFinance();

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    const now = new Date();
    const thisWeekStart = daysAgo(6); // last 7 days incl today
    const lastWeekStart = daysAgo(13);
    const lastWeekEnd = daysAgo(7);

    const expenses = transactions.filter((t) => t.type === "expense");

    const inRange = (iso: string, start: Date, end: Date) => {
      const d = startOfDay(new Date(iso));
      return d >= start && d <= end;
    };

    const thisWeek = expenses.filter((t) => inRange(t.date, thisWeekStart, startOfDay(now)));
    const lastWeek = expenses.filter((t) => inRange(t.date, lastWeekStart, lastWeekEnd));

    const sum = (arr: typeof expenses) => arr.reduce((s, t) => s + t.amount, 0);
    const thisTotal = sum(thisWeek);
    const lastTotal = sum(lastWeek);

    // 1. Week-over-week comparison
    if (thisTotal > 0 || lastTotal > 0) {
      if (lastTotal === 0 && thisTotal > 0) {
        out.push({
          id: "wow",
          icon: TrendingUp,
          title: "Spending kicked off this week",
          body: `You spent ${formatCurrency(thisTotal)} over the last 7 days. No expenses the week before — a fresh baseline starts now.`,
          tone: "neutral",
        });
      } else if (thisTotal === 0 && lastTotal > 0) {
        out.push({
          id: "wow",
          icon: TrendingDown,
          title: "A quiet spending week",
          body: `No expenses logged this week, down from ${formatCurrency(lastTotal)} last week. Nicely done.`,
          tone: "positive",
        });
      } else if (lastTotal > 0) {
        const diff = thisTotal - lastTotal;
        const pct = Math.round((diff / lastTotal) * 100);
        if (Math.abs(pct) < 3) {
          out.push({
            id: "wow",
            icon: Sparkles,
            title: "Steady as she goes",
            body: `Your spending is roughly flat week-over-week at ${formatCurrency(thisTotal)}. Consistency is a quiet superpower.`,
            tone: "neutral",
          });
        } else if (diff > 0) {
          out.push({
            id: "wow",
            icon: TrendingUp,
            title: `You spent ${pct}% more this week`,
            body: `That's ${formatCurrency(diff)} above last week's ${formatCurrency(lastTotal)}. Worth a quick look at where it went.`,
            tone: "negative",
          });
        } else {
          out.push({
            id: "wow",
            icon: TrendingDown,
            title: `You spent ${Math.abs(pct)}% less this week`,
            body: `That's ${formatCurrency(Math.abs(diff))} below last week. Keep the momentum going.`,
            tone: "positive",
          });
        }
      }
    }

    // 2. Biggest category mover (week over week)
    const byCatThis = new Map<string, number>();
    const byCatLast = new Map<string, number>();
    thisWeek.forEach((t) => byCatThis.set(t.categoryId, (byCatThis.get(t.categoryId) ?? 0) + t.amount));
    lastWeek.forEach((t) => byCatLast.set(t.categoryId, (byCatLast.get(t.categoryId) ?? 0) + t.amount));
    const allCatIds = new Set<string>([...byCatThis.keys(), ...byCatLast.keys()]);
    let topMover: { id: string; diff: number } | null = null;
    allCatIds.forEach((id) => {
      const diff = (byCatThis.get(id) ?? 0) - (byCatLast.get(id) ?? 0);
      if (!topMover || Math.abs(diff) > Math.abs(topMover.diff)) topMover = { id, diff };
    });
    if (topMover && Math.abs(topMover.diff) >= 1) {
      const cat = categories.find((c) => c.id === topMover!.id);
      const name = cat?.name ?? "Uncategorized";
      const up = topMover.diff > 0;
      out.push({
        id: "mover",
        icon: up ? TrendingUp : TrendingDown,
        title: `${name} ${up ? "increased" : "dropped"} by ${formatCurrency(Math.abs(topMover.diff))}`,
        body: up
          ? `${name} costs are trending up versus last week. Might be worth a closer look.`
          : `${name} costs eased off compared to last week. Nice trim.`,
        tone: up ? "negative" : "positive",
      });
    }

    // 3. Top category this month
    const monthExpenses = expenses.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    if (monthExpenses.length) {
      const monthMap = new Map<string, number>();
      monthExpenses.forEach((t) => monthMap.set(t.categoryId, (monthMap.get(t.categoryId) ?? 0) + t.amount));
      const monthTotal = sum(monthExpenses);
      const [topId, topVal] = [...monthMap.entries()].sort((a, b) => b[1] - a[1])[0];
      const cat = categories.find((c) => c.id === topId);
      const share = Math.round((topVal / monthTotal) * 100);
      out.push({
        id: "top",
        icon: Trophy,
        title: `${cat?.name ?? "Uncategorized"} is your top expense this month`,
        body: `It accounts for ${share}% of this month's spending — about ${formatCurrency(topVal)} so far.`,
        tone: "neutral",
      });
    }

    // 4. Daily average this week
    if (thisWeek.length) {
      const avg = thisTotal / 7;
      out.push({
        id: "avg",
        icon: CalendarDays,
        title: `Averaging ${formatCurrency(avg)} per day`,
        body: `Across ${thisWeek.length} expense${thisWeek.length === 1 ? "" : "s"} in the last 7 days.`,
        tone: "neutral",
      });
    }

    return out;
  }, [transactions, categories]);

  if (!insights.length) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 shadow-elevated">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Weekly insights</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Add a few transactions and we'll surface trends, comparisons, and where your money is going.
        </p>
      </div>
    );
  }

  const toneClasses = (tone: Insight["tone"]) => {
    switch (tone) {
      case "positive":
        return "bg-success/10 text-success";
      case "negative":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-card border border-border p-6 shadow-elevated"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Weekly insights</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            A quick read on how your spending is trending.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-border bg-background/50 p-4 flex gap-3 card-hover"
            >
              <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${toneClasses(ins.tone)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm leading-snug">{ins.title}</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{ins.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}