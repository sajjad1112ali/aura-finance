import { RecurringFrequency } from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function todayISO() {
  // Use the user's LOCAL calendar day so scheduling is intuitive across
  // timezones. UTC-based slicing can drift by a day for users east/west
  // of UTC and cause occurrences to be skipped or duplicated.
  return toISO(new Date());
}

export function addOccurrence(dateISO: string, frequency: RecurringFrequency): string {
  // Parse the YYYY-MM-DD string as a LOCAL date (not UTC) so subsequent
  // toISO() — which reads local components — produces a stable result.
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (frequency === "daily") dt.setDate(dt.getDate() + 1);
  else if (frequency === "weekly") dt.setDate(dt.getDate() + 7);
  else if (frequency === "monthly") dt.setMonth(dt.getMonth() + 1);
  return toISO(dt);
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