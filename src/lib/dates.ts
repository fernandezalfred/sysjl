import type { TranslateFn } from "@/lib/i18n/translations";

// "Nov 12, 26 jueves": the short date followed by its day of the week in the
// user's language.
export function formatShortDate(isoDate: string, t: TranslateFn): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const short = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(date);
  return `${short} ${t(`weekday.${date.getDay()}`)}`;
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

// The business operates in Bolivia. Server code must use this zone, not the
// server's own (UTC on Vercel), or a purchase made after 20:00 local time lands
// on the next day and stops matching that day's sale records.
export const BUSINESS_TIME_ZONE = "America/La_Paz";

const BUSINESS_DATE_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// A Date's calendar day in BUSINESS_TIME_ZONE as YYYY-MM-DD, regardless of the
// timezone the code runs in.
export function formatBusinessDateKey(date: Date): string {
  return BUSINESS_DATE_KEY_FORMAT.format(date);
}

// Today's date in the browser's local timezone, as YYYY-MM-DD.
export function todayDateString(): string {
  return formatDateKey(new Date());
}
