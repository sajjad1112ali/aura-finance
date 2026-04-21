import { RecurringFrequency } from "@/types";

const toISO = (d: Date) => d.toISOString().slice(0, 10);

export function todayISO() {
  return toISO(new Date());
}

export function addOccurrence(dateISO: string, frequency: RecurringFrequency): string {
  const d = new Date(dateISO + "T00:00:00");
  if (frequency === "daily") d.setDate(d.getDate() + 1);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  return toISO(d);
}

/**
 * Given a recurring rule, compute every occurrence date that should have
 * been posted between (lastPostedDate || just-before-startDate) and today.
 * Returns dates strictly AFTER lastPostedDate (or including startDate if none).
 */
export function dueOccurrences(
  startDate: string,
  frequency: RecurringFrequency,
  lastPostedDate: string | undefined,
  today: string = todayISO()
): string[] {
  if (startDate > today) return [];
  const dates: string[] = [];
  let cursor = lastPostedDate ? addOccurrence(lastPostedDate, frequency) : startDate;
  // Safety cap to avoid runaway loops
  let guard = 0;
  while (cursor <= today && guard < 5000) {
    dates.push(cursor);
    cursor = addOccurrence(cursor, frequency);
    guard++;
  }
  return dates;
}