import { buildGrainsShareByDate, type MilkGrainsDeductions, type UnitCosts } from "@/lib/money/revenue";
import { getCurrentPurchaseCosts } from "@/lib/money/product-prices";
import { getGrainsCostByDay, getMilkCostByUserAndDay } from "@/lib/money/stock";
import type { DailyRecordRow } from "@/types/daily-records";

export interface NetProfitInputs {
  unitCosts: UnitCosts;
  deductions: MilkGrainsDeductions;
}

// Everything recordAdjustedRevenue needs to compute each Sale Record's Net profit,
// read live from the database so a changed purchase cost or quantity is reflected
// immediately. Cost data is admin-only — callers must gate this on the admin role.
export async function getNetProfitInputs(records: DailyRecordRow[]): Promise<NetProfitInputs> {
  const [purchaseCosts, milkCostByUserDay, grainsCostByDay] = await Promise.all([
    getCurrentPurchaseCosts(),
    getMilkCostByUserAndDay(),
    getGrainsCostByDay(),
  ]);

  return {
    unitCosts: purchaseCosts,
    deductions: { milkCostByUserDay, grainsShareByDate: buildGrainsShareByDate(grainsCostByDay, records) },
  };
}
