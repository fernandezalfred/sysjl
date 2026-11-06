export type ProductCode = "QUESO" | "YOGURT";

export interface SaleRecord {
  id: string;
  workRecordId: string;
  totalSold: number;
  createdAt: string;
  date: string;
  userId: string;
  userName: string;
  product: ProductCode;
  unitPrice: number;
  quantityTaken: number;
  quantityRemaining: number;
}

export interface UserTotal {
  date: string;
  userId: string;
  userName: string;
  quesoRevenue: number;
  yogurtRevenue: number;
  milkMoteRevenue: number;
  totalRevenue: number;
  isDailyWinner: boolean;
  winnerMargin: number | null;
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
  isDailyWinner: boolean;
  winnerMargin: number | null;
}

export interface LandingPageData {
  dailyRecords: DailyRecordRow[];
  userTotals: UserTotal[];
  generatedAt: string;
}
