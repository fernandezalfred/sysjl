export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(date);
}

// A Date's local calendar day as YYYY-MM-DD. Deliberately not `toISOString()`,
// which reports the UTC day and can land on the wrong calendar day for timezones
// behind UTC late at night.
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Today's date in the browser's local timezone, as YYYY-MM-DD.
export function todayDateString(): string {
  return formatDateKey(new Date());
}
