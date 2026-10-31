import type { Role } from "@prisma/client";

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
