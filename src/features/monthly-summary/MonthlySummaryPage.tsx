import { useMemo, useState } from "react";
import { useFinance } from "@/store/finance";
import { formatCurrency } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/AnimatedNumber";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthlySummaryPage() {
  const transactions = useFinance((s) => s.transactions);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-based

  const years = useMemo(() => {
    const set = new Set<number>();
    transactions.forEach((tx) => {
      const year = Number(tx.date.slice(0, 4));
      if (!Number.isNaN(year)) set.add(year);
    });
    const list = Array.from(set).sort((a, b) => b - a);
    return list.length ? list : [currentYear];
  }, [transactions, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(
    years.includes(currentYear) ? currentYear : years[0]
  );

  const monthlyTotals = useMemo(() => {
    const totals = new Array(12).fill(0);
    transactions.forEach((tx) => {
      if (tx.type !== "expense") return;
      const year = Number(tx.date.slice(0, 4));
      const month = Number(tx.date.slice(5, 7)) - 1;
      if (year === selectedYear && month >= 0 && month < 12) {
        totals[month] += tx.amount;
      }
    });
    return totals;
  }, [transactions, selectedYear]);

  const visibleMonths = useMemo(() => {
    if (selectedYear < currentYear) return 12;
    if (selectedYear > currentYear) return 0;
    return currentMonth + 1;
  }, [selectedYear, currentYear, currentMonth]);

  const annualTotal = useMemo(() => {
    return monthlyTotals.slice(0, visibleMonths).reduce((sum, v) => sum + v, 0);
  }, [monthlyTotals, visibleMonths]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">
            Monthly Expenses Summary
          </h2>
          <p className="text-sm text-muted-foreground">
            Total expenses for each month in {selectedYear}
          </p>
        </div>
        <Select
          value={String(selectedYear)}
          onValueChange={(value) => setSelectedYear(Number(value))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {selectedYear} Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-display font-bold">
            <AnimatedNumber value={annualTotal} format={(n) => formatCurrency(n)} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Total expenses for {selectedYear === currentYear ? "months to date" : "the full year"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTH_NAMES.slice(0, visibleMonths).map((name, index) => {
          const total = monthlyTotals[index];
          return (
            <Card
              key={name}
              className={
                total > 0
                  ? "border-l-4 border-l-primary"
                  : "opacity-80"
              }
            >
              <CardContent className="p-5">
                <div className="text-sm font-medium text-muted-foreground">
                  {name}
                </div>
                <div className="mt-2 text-2xl font-display font-bold">
                  <AnimatedNumber
                    value={total}
                    format={(n) => formatCurrency(n)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {visibleMonths === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No data available for future years.
        </div>
      )}
    </div>
  );
}
