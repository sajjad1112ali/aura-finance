import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Category } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";

const rows = (txs: Transaction[], cats: Category[]) =>
  txs.map((t) => {
    const cat = cats.find((c) => c.id === t.categoryId);
    return {
      Date: formatDate(t.date),
      Type: t.type,
      Category: cat?.name ?? "Uncategorized",
      Description: t.description || "—",
      Amount: t.amount.toFixed(2),
    };
  });

export function exportCSV(txs: Transaction[], cats: Category[]) {
  const data = rows(txs, cats);
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

  const data = rows(txs, cats);
  autoTable(doc, {
    startY: 42,
    head: [["Date", "Type", "Category", "Description", "Amount"]],
    body: data.map((r) => [r.Date, r.Type, r.Category, r.Description, r.Amount]),
    theme: "striped",
    headStyles: { fillColor: [56, 128, 135], textColor: 255 },
    styles: { fontSize: 9 },
  });

  doc.save(`transactions-${Date.now()}.pdf`);
}
