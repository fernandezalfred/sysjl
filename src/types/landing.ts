export type ProductCode = "QUESO" | "YOGURT";

export interface SaleRecord {
  id: string;
  workRecordId: string;
  totalSold: number;
  createdAt: string;
  date: string;
  userId: string;
  userName: string;
  vehicleId: string;
  vehicleName: string;
  product: ProductCode;
  unitPrice: number;
  quantityTaken: number;
  quantityRemaining: number;
}

export interface ProductTotal {
  product: ProductCode;
  label: string;
  quantitySold: number;
  revenue: number;
  quantityRemaining: number;
  remainingValue: number;
}

export interface UserTotal {
  userId: string;
  userName: string;
  quantitySoldByProduct: Record<ProductCode, number>;
  totalQuantitySold: number;
  totalRevenue: number;
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
  createdAt: string;
  date: string;
  userId: string;
  userName: string;
  queso: ProductBreakdown;
  yogurt: ProductBreakdown;
  milkMoteRevenue: number;
  totalRevenue: number;
}

export interface LandingPageData {
  dailyRecords: DailyRecordRow[];
  productTotals: ProductTotal[];
  userTotals: UserTotal[];
  grandTotalQuantitySold: number;
  grandTotalRevenue: number;
  grandTotalRemainingQuantity: number;
  grandTotalRemainingValue: number;
  generatedAt: string;
}
