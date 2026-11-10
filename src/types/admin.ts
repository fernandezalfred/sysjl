import type { Product, Role } from "@prisma/client";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

// The items selectable from /admin/grains' "Item" dropdown — all quartilla-priced.
export type GrainProduct = "MAIZ_PELADO" | "MAIZ_CASCARA" | "HABA";

export interface StockPurchaseRow {
  id: string;
  // Which grain item it is (Grains covers three items on one page).
  product: Product;
  quantity: number;
  unitCost: number;
  // Always the admin who entered the purchase, for every product.
  createdByName: string;
  // Pre-formatted server-side (not a raw timestamp): formatting it in the client
  // component that renders this list would re-run on hydration and can mismatch
  // the server-rendered string (different ICU data between Node and the browser).
  createdAtFormatted: string;
  // Raw YYYY-MM-DD grouping key (see formatBusinessDateKey in src/lib/dates.ts); Grains
  // groups purchases by day.
  createdAtDate: string;
}
