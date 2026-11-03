import type { ProductCode } from "@/types/landing";

export const PRODUCT_LABELS: Record<ProductCode, string> = {
  QUESO: "Queso",
  YOGURT: "Yogurt",
};

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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(amount);
}
