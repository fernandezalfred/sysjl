import type { ProductCode } from "@/types/landing";

export const PRODUCT_LABELS: Record<ProductCode, string> = {
  QUESO: "Queso",
  YOGURT: "Yogurt",
};

// Admin-configurable in the full system; these are the current values from
// context/project-overview.md §4 until cost/price management is implemented.
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
