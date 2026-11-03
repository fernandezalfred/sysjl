export type Granularity = "day" | "week" | "month";

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

// The period a YYYY-MM-DD date falls in: the day itself, its week's Monday, or YYYY-MM.
export function bucketKey(dateStr: string, granularity: Granularity): string {
  if (granularity === "month") return dateStr.slice(0, 7);
  if (granularity === "week") return startOfWeek(dateStr);
  return dateStr;
}
