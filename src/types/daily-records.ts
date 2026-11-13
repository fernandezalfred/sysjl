export type ProductCode = "QUESO" | "YOGURT";

export interface SaleRecord {
  id: string;
  workRecordId: string;
  totalSold: number;
  // The admin marked this day's seller pay as paid.
  payPaid: boolean;
  createdAt: string;
  date: string;
  userId: string;
  userName: string;
  product: ProductCode;
  unitPrice: number;
  quantityTaken: number;
  quantityRemaining: number;
  milkLiters: number;
  milkUnitCost: number;
  // The purchase cost snapshotted on the record (cost data, admin only); null or
  // missing on older records, which use the current purchase cost.
  purchaseCost?: number | null;
}

export interface ProductBreakdown {
  taken: number;
  remaining: number;
  sold: number;
  revenue: number;
  remainingValue: number;
}

export interface DailyRecordRow {
  id: string;
  workRecordId: string;
  totalSold: number;
  payPaid: boolean;
  createdAt: string;
  date: string;
  userId: string;
  userName: string;
  queso: ProductBreakdown;
  yogurt: ProductBreakdown;
  milkMoteRevenue: number;
  totalRevenue: number;
  isDailyWinner: boolean;
  winnerMargin: number | null;
  lossMargin: number | null;
  // Milk the seller took that day and its purchase price per liter (cost data:
  // zeroed before reaching guests, see withoutMilkCost).
  milkLiters: number;
  milkUnitCost: number;
  // Queso / Yogurt purchase cost snapshotted on the record (admin only — stripped
  // for sellers, see withoutPurchaseCosts); null/missing → the current cost.
  purchaseCosts?: Partial<Record<ProductCode, number | null>>;
}

export interface DailyRecordsData {
  dailyRecords: DailyRecordRow[];
  generatedAt: string;
}
export interface DailyWorkRecordRow {
  id: string;
  userName: string;
  date: string;
  quesoTaken: number;
  quesoRemaining: number;
  yogurtTaken: number;
  yogurtRemaining: number;
  totalSold: number;
  milkLiters: number;
  milkUnitCost: number;
}
