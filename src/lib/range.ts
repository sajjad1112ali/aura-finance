const pad = (n: number) => String(n).padStart(2, "0");

const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function monthRange(d: Date): { from: string; to: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = `${y}-${pad(m + 1)}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const last = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
  return { from: first, to: last };
}

export function currentMonthRange(): { from: string; to: string } {
  return monthRange(new Date());
}

export function shiftMonth(d: Date, offset: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const daysAgo = (n: number): Date => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
};