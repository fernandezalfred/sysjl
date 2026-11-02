import type { Product, Role } from "@prisma/client";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

// Covers /admin/cheese only — fixed to one product. Yogurt and Milk each have their
// own implementation (YogurtPurchasesSection, MilkPurchasesSection — day-grouping,
// earning/driver-attribution specifics that no longer fit this simple shared shape),
// and Maiz Pelado/Cascara/Haba are picked per-purchase on /admin/grains instead.
export type SingleStockProduct = "QUESO";

// The items selectable from /admin/grains' "Item" dropdown — all quartilla-priced.
export type GrainProduct = "MAIZ_PELADO" | "MAIZ_CASCARA" | "HABA";

export interface StockPurchaseRow {
  id: string;
  // Only read by multi-product pages (e.g. Grains); single-product pages (Cheese,
  // Yogurt, Milk) already know their product from the page itself and ignore this.
  product: Product;
  quantity: number;
  unitCost: number;
  // Always the admin who entered the purchase, for every product.
  createdByName: string;
  // Only read by Milk: which driver the purchase is for (StockPurchase.forUser),
  // null for every other product and for pre-existing Milk purchases with no driver
  // set.
  forUserName: string | null;
  // Pre-formatted server-side (not a raw timestamp): formatting it in the client
  // component that renders this list would re-run on hydration and can mismatch
  // the server-rendered string (different ICU data between Node and the browser).
  createdAtFormatted: string;
  // Raw YYYY-MM-DD grouping key (see formatDateKey in src/lib/dates.ts). Only read
  // by Grains, Milk, and Yogurt, which group purchases by day; Cheese ignores it.
  createdAtDate: string;
}
