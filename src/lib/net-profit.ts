import { buildGrainsShareByDate, type MilkGrainsDeductions, type UnitCosts } from "@/lib/revenue";
import { getGrainsCostByDay, getLatestUnitCost, getMilkCostByUserAndDay } from "@/lib/stock";
import type { DailyRecordRow } from "@/types/landing";

export interface NetProfitInputs {
  unitCosts: UnitCosts;
  deductions: MilkGrainsDeductions;
}

// Everything recordAdjustedRevenue needs to compute each Sale Record's Net profit,
// read live from the database so a changed purchase cost or quantity is reflected
// immediately. Cost data is admin-only — callers must gate this on the admin role.
export async function getNetProfitInputs(records: DailyRecordRow[]): Promise<NetProfitInputs> {
  const [quesoCost, yogurtCost, milkCostByUserDay, grainsCostByDay] = await Promise.all([
    getLatestUnitCost("QUESO"),
    getLatestUnitCost("YOGURT"),
    getMilkCostByUserAndDay(),
    getGrainsCostByDay(),
  ]);

  return {
    unitCosts: { QUESO: quesoCost, YOGURT: yogurtCost },
    deductions: { milkCostByUserDay, grainsShareByDate: buildGrainsShareByDate(grainsCostByDay, records) },
  };
}
