import type { Role } from "@prisma/client";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  vehicleId: string | null;
  vehicleName: string | null;
}

export interface AdminVehicleOption {
  id: string;
  name: string;
  assignedUserId: string | null;
}

export interface ProductPriceHistoryRow {
  id: string;
  product: "QUESO" | "YOGURT";
  purchasePrice: number;
  salePrice: number;
  setByName: string;
  createdAt: string;
}
