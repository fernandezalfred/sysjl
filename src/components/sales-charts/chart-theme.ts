import type { Locale } from "@/lib/i18n/translations";

// From the dataviz skill's palette, checked with its validate_palette.js in light and
// dark. Unsold (red) is stacked directly on top of Queso and Yogurt, so those two
// pairs must clear the separation floors: blue↔red and violet↔red both pass, while
// orange↔red failed — which is why Yogurt is violet here. Each bar also carries its
// product name on the axis, so product identity never relies on color alone.
export const CHART_COLORS = {
  queso: { light: "#2a78d6", dark: "#3987e5" },
  yogurt: { light: "#6250d6", dark: "#9085e9" },
  milkMote: { light: "#1baf7a", dark: "#199e70" },
  unsold: { light: "#e34948", dark: "#e66767" },
  // Total sold per user chart: green (Total venta) and magenta (Total sold + unsold) —
  // the palette's slots 6 and 5, hues used by no other chart on the page. The pair
  // passes validate_palette.js in light and dark; magenta is under 3:1 on the light
  // surface, so every bar also carries its written amount and user name.
  userSales: { light: "#008300", dark: "#008300" },
  userSalesWithUnsold: { light: "#e87ba4", dark: "#d55181" },
  surface: { light: "#fcfcfb", dark: "#1a1a19" },
  grid: { light: "#e1e0d9", dark: "#2c2c2a" },
  axis: { light: "#c3c2b7", dark: "#383835" },
  muted: "#898781",
  ink: { light: "#0b0b0b", dark: "#f0efec" },
};

export function intlLocale(locale: Locale): string {
  return locale === "es" ? "es-BO" : "en-US";
}

export function formatDayLabel(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short" }).format(
    new Date(`${isoDate}T00:00:00`),
  );
}

export function formatMonthLabel(month: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`),
  );
}

// Horizontal bars: the chart grows with the bar count (~1.6rem a bar) so bars stay
// readable with any number of sellers; past 24 bars its frame scrolls (see
// CHART_SCROLL_FRAME). Full class strings so Tailwind generates them.
const BAR_CHART_HEIGHTS: { maxBars: number; className: string }[] = [
  { maxBars: 3, className: "h-40" },
  { maxBars: 6, className: "h-64" },
  { maxBars: 12, className: "h-96" },
  { maxBars: 24, className: "h-[40rem]" },
  { maxBars: 40, className: "h-[64rem]" },
  { maxBars: 60, className: "h-[96rem]" },
  { maxBars: 100, className: "h-[160rem]" },
  { maxBars: 160, className: "h-[256rem]" },
];

export function chartHeightClass(barCount: number): string {
  return BAR_CHART_HEIGHTS.find((h) => barCount <= h.maxBars)?.className ?? "h-[400rem]";
}

// A tall bar chart scrolls inside this frame instead of stretching the page.
export function chartScrollFrameClass(barCount: number): string {
  return barCount > 24 ? "styled-scroll max-h-[40rem] overflow-y-auto overscroll-y-contain pr-1" : "";
}

// The dataviz palette's eight categorical slots first, so the first eight users look
// as before; after that each user gets a generated hue (golden-angle steps keep
// neighbours apart), lighter in dark mode.
const USER_PALETTE = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#eb6834", dark: "#d95926" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#008300", dark: "#008300" },
  { light: "#6250d6", dark: "#9085e9" },
  { light: "#e34948", dark: "#e66767" },
];

export function userColor(index: number, mode: "light" | "dark"): string {
  if (index < USER_PALETTE.length) return USER_PALETTE[index][mode];
  const hue = Math.round((index * 137.508) % 360);
  return mode === "dark" ? `hsl(${hue} 65% 62%)` : `hsl(${hue} 70% 42%)`;
}
