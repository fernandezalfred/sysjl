import type { Product, Role } from "@prisma/client";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface ProductPriceHistoryRow {
  id: string;
  product: "QUESO" | "YOGURT";
  purchasePrice: number;
  salePrice: number;
  setByName: string;
  createdAt: string;
}

// Covers /admin/cheese, /admin/yogurt, /admin/milk — pages fixed to one product.
// Maiz Pelado/Cascara and Haba are picked per-purchase on /admin/grains instead.
export type SingleStockProduct = "QUESO" | "YOGURT" | "MILK";

// The items selectable from /admin/grains' "Item" dropdown — all quintal-priced.
export type GrainProduct = "MAIZ_PELADO" | "MAIZ_CASCARA" | "HABA";

export interface StockPurchaseRow {
  id: string;
  // Only read by multi-product pages (e.g. Grains); single-product pages (Cheese,
  // Yogurt, Milk) already know their product from the page itself and ignore this.
  product: Product;
  quantity: number;
  unitCost: number;
  createdByName: string;
  // Pre-formatted server-side (not a raw timestamp): formatting it in the client
  // component that renders this list would re-run on hydration and can mismatch
  // the server-rendered string (different ICU data between Node and the browser).
  createdAtFormatted: string;
}
