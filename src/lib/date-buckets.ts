export type Granularity = "day" | "week" | "month";

export interface TrendItem {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface PeriodTotal {
  period: string; // day -> YYYY-MM-DD; week -> that week's Monday, YYYY-MM-DD; month -> YYYY-MM
  total: number;
}

// Monday of the ISO week containing dateStr, as YYYY-MM-DD. Parsed as a local
// midnight (not UTC) so this agrees with how every other date in this app reads
// a YYYY-MM-DD string — see the same pattern in formatShortDate (src/lib/dates.ts).
function startOfWeek(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const day = date.getDay();
  const diffFromMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diffFromMonday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

function bucketKey(dateStr: string, granularity: Granularity): string {
  if (granularity === "month") return dateStr.slice(0, 7);
  if (granularity === "week") return startOfWeek(dateStr);
  return dateStr;
}

// Sums `value` per bucket (day, that week's Monday, or month), oldest period first.
export function aggregateByPeriod(items: TrendItem[], granularity: Granularity): PeriodTotal[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const key = bucketKey(item.date, granularity);
    totals.set(key, (totals.get(key) ?? 0) + item.value);
  }
  return Array.from(totals.entries())
    .map(([period, total]) => ({ period, total }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// Short display date for a period key. For "week" this is the Monday the bucket
// starts on — callers prefix it with a translated "Week of" label.
export function formatPeriodLabel(period: string, granularity: Granularity): string {
  if (granularity === "month") {
    const date = new Date(`${period}-01T00:00:00`);
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
  }
  const date = new Date(`${period}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}
