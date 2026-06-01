import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Category } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";

type Row = {
  Date: string;
  Type: string;
  Category: string;
  Description: string;
  Amount: string;
  _isSummary?: boolean;
};

const MONTH_LABEL = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
};

const monthKey = (iso: string) => iso.slice(0, 7);

function buildRows(txs: Transaction[], cats: Category[]): Row[] {
  const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
  const groups = new Map<string, Transaction[]>();
  for (const t of sorted) {
    const k = monthKey(t.date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }

  const out: Row[] = [];
  let grandIncome = 0;
  let grandExpense = 0;

  for (const [ym, list] of groups) {
    let income = 0;
    let expense = 0;
    for (const t of list) {
      const cat = cats.find((c) => c.id === t.categoryId);
      out.push({
        Date: formatDate(t.date),
        Type: t.type,
        Category: cat?.name ?? "Uncategorized",
        Description: t.description || "—",
        Amount: t.amount.toFixed(2),
      });
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    grandIncome += income;
    grandExpense += expense;
    const label = MONTH_LABEL(ym);
    out.push({ Date: "", Type: "", Category: label, Description: "Total Income", Amount: income.toFixed(2), _isSummary: true });
    out.push({ Date: "", Type: "", Category: label, Description: "Total Expenses", Amount: expense.toFixed(2), _isSummary: true });
    out.push({ Date: "", Type: "", Category: label, Description: "Net Amount", Amount: (income - expense).toFixed(2), _isSummary: true });
  }

  if (groups.size > 1) {
    out.push({ Date: "", Type: "", Category: "GRAND TOTAL", Description: "Total Income", Amount: grandIncome.toFixed(2), _isSummary: true });
    out.push({ Date: "", Type: "", Category: "GRAND TOTAL", Description: "Total Expenses", Amount: grandExpense.toFixed(2), _isSummary: true });
    out.push({ Date: "", Type: "", Category: "GRAND TOTAL", Description: "Net Amount", Amount: (grandIncome - grandExpense).toFixed(2), _isSummary: true });
  }

  return out;
}

export function exportCSV(txs: Transaction[], cats: Category[]) {
  const data = buildRows(txs, cats);
  const headers = ["Date", "Type", "Category", "Description", "Amount"];
  const csv = [
    headers.join(","),
    ...data.map((r) =>
      headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(txs: Transaction[], cats: Category[]) {
  const doc = new jsPDF();
  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  doc.setFontSize(20);
  doc.setTextColor(56, 128, 135);
  doc.text("Transaction Report", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Generated ${formatDate(new Date().toISOString())}`, 14, 27);
  doc.text(`Income: ${formatCurrency(totalIncome)}   Expenses: ${formatCurrency(totalExpense)}   Balance: ${formatCurrency(totalIncome - totalExpense)}`, 14, 34);

  const data = buildRows(txs, cats);
  autoTable(doc, {
    startY: 42,
    head: [["Date", "Type", "Category", "Description", "Amount"]],
    body: data.map((r) => [r.Date, r.Type, r.Category, r.Description, r.Amount]),
    theme: "striped",
    headStyles: { fillColor: [56, 128, 135], textColor: 255 },
    styles: { fontSize: 9 },
    didParseCell: (hookData) => {
      const row = data[hookData.row.index];
      if (row?._isSummary) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [232, 244, 245];
        hookData.cell.styles.textColor = [30, 60, 70];
      }
    },
  });

  doc.save(`transactions-${Date.now()}.pdf`);
}
