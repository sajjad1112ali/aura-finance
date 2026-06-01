## Goal
Add per-month summaries (Total Income, Total Expenses, Net Total) to both the PDF and CSV ("Excel") exports.

## Changes
Single file: `src/services/exporter.ts`

### Shared helper
- Sort transactions ascending by date.
- Group them by month key `YYYY-MM`.
- For each group compute: `income`, `expense`, `net = income - expense`, and a display label like `"March 2025"`.

### CSV export (`exportCSV`)
- Iterate months in chronological order.
- For each month:
  - Write a month header row: `"<Month YYYY>"` in the Date column (other cells blank) for readability.
  - Write all transaction rows for that month.
  - Append three summary rows:
    - `,,,Total Income,<sum>`
    - `,,,Total Expenses,<sum>`
    - `,,,Net Total,<net>`
  - Blank separator row between months.
- Keep current header row at the top.

### PDF export (`exportPDF`)
- Keep the top header (title, generated date, overall totals).
- Replace the single `autoTable` with one `autoTable` per month, using `startY` from `doc.lastAutoTable.finalY`.
  - Add a small section heading `"<Month YYYY>"` above each table (`doc.text`).
  - Body = transactions for that month.
  - Append three foot rows (or extra body rows styled bold) for Total Income, Total Expenses, Net Total in the Amount column.
  - Use `didDrawPage` / page-break safety provided by autoTable defaults.

## Out of scope
- No changes to the in-app UI, totals shown on screen, or the underlying store.
- Overall totals at the top of the PDF stay as-is.
