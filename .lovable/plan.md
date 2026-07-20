# Monthly Expenses Summary Page

## Summary
Create a dedicated "Monthly Expenses Summary" page that lists total expenses per month for a selected year, with a year filter.

## Details
- Add a new route/component for the monthly expenses summary.
- Add a year filter dropdown populated from available transaction years.
- Show one entry per month (Jan–Dec) with the month name and total expense amount for that month.
- For the current year, only show months up to the current month.
- For past years, show all 12 months.
- Use the existing expense transaction data from the finance store.
- Add navigation to the new page (e.g., a tab or menu item in the app shell).
- Keep styling consistent with the existing app (Tailwind + shadcn components).

## Files to change
- `src/pages/Index.tsx` — wire the new tab/page into the main routing/tab switcher.
- `src/components/AppShell.tsx` — add a new tab entry for the monthly summary.
- `src/features/monthly-summary/MonthlySummaryPage.tsx` — new page component with year filter and monthly totals.
- `src/types/index.ts` (if needed) — no new types expected.

## Technical approach
- Derive available years from the user's transactions (expense types only).
- Compute monthly totals by grouping transactions by year-month and summing `amount` for `type === "expense"`.
- Default selected year to the current year.
- Use existing `formatCurrency` helper for amounts.
- Use existing shadcn components (Select, Card, etc.) for UI.
