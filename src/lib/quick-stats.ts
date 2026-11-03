import { recordAdjustedRevenue, type MilkGrainsDeductions, type UnitCosts } from "@/lib/revenue";
import type { DailyRecordRow } from "@/types/landing";

export interface QuickStatsData {
  // Most recent day that has at least one Sale Record (YYYY-MM-DD), or null if none.
  lastDay: string | null;
  lastDaySales: number;
  lastDayNetProfit: number;
  // Calendar month being summarized (YYYY-MM).
  month: string;
  monthNetProfit: number;
  stock: { QUESO: number; YOGURT: number };
}

// Admin Quick Stats: the latest working day's total sales and Net profit, this
// month's Net profit, and current deposit stock. Net profit uses the exact same
// per-record formula as Sale Records (recordAdjustedRevenue), so the two agree.
export function buildQuickStats(
  records: DailyRecordRow[],
  unitCosts: UnitCosts,
  deductions: MilkGrainsDeductions,
  month: string,
  stock: { QUESO: number; YOGURT: number },
): QuickStatsData {
  const lastDay = records.reduce<string | null>((max, r) => (max === null || r.date > max ? r.date : max), null);
  const netProfit = (r: DailyRecordRow) => recordAdjustedRevenue(r, unitCosts, deductions);

  let lastDaySales = 0;
  let lastDayNetProfit = 0;
  let monthNetProfit = 0;
  for (const r of records) {
    if (r.date === lastDay) {
      lastDaySales += r.totalSold;
      lastDayNetProfit += netProfit(r);
    }
    if (r.date.startsWith(`${month}-`)) monthNetProfit += netProfit(r);
  }

  return { lastDay, lastDaySales, lastDayNetProfit, month, monthNetProfit, stock };
}
