import type { ProductCode } from "@/types/landing";

// i18n keys for showing a product's name in the UI in the viewer's language.
export const PRODUCT_LABEL_KEYS: Record<ProductCode, string> = {
  QUESO: "product.queso",
  YOGURT: "product.yogurt",
};

// Fallback sale price used only when the admin hasn't set a price for a product yet
// (see src/lib/product-prices.ts) — the starting values from context/project-overview.md §4.
export const CURRENT_UNIT_PRICE: Record<ProductCode, number> = {
  QUESO: 9,
  YOGURT: 33,
};

// Amounts are always shown in whole bolivianos, rounded to the nearest one
// (1.160,40 -> "Bs 1.160"); this is display only, calculations keep their cents.
// A value that rounds to zero is shown as 0, never "-0".
function roundForDisplay(amount: number): number {
  const rounded = Math.round(amount);
  return rounded === 0 ? 0 : rounded;
}

const CURRENCY_FORMAT = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// "Bs 3.556"
export function formatCurrency(amount: number): string {
  return CURRENCY_FORMAT.format(roundForDisplay(amount));
}
