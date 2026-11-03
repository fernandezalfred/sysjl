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

// Horizontal bars (one per user): the chart grows with the user count so bars stay readable.
export function chartHeightClass(userCount: number): string {
  if (userCount <= 3) return "h-40";
  if (userCount <= 6) return "h-64";
  return "h-96";
}
