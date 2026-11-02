import type { DailyRecordRow, ProductCode } from "@/types/landing";

export type UnitCosts = Record<ProductCode, number>;

// Per-driver/per-day deductions applied on top of the Queso/Yogurt/Milk&Mote profit
// below. Milk and grains have no per-record sold-quantity tracking, so these are
// approximations rather than exact per-unit costs: `milkCostByUserId` is each
// driver's most recent Milk purchase cost (quantity*unitCost, from
// getLatestMilkCostByUser in src/lib/stock.ts), and `grainsShareByDate` is a given
// day's total grain purchase cost split evenly across that day's work records
// (getGrainsCostByDay in src/lib/stock.ts, divided by that day's record count).
// Both default to 0 for a user/day with no matching purchase.
export interface MilkGrainsDeductions {
  milkCostByUserId: Record<string, number>;
  grainsShareByDate: Record<string, number>;
}

// Profit actually earned on one record: for Queso and Yogurt, each sold unit's
// margin is its snapshotted sale price minus the product's purchase cost (passed
// in, not hardcoded, since the admin can record a new purchase at a different cost
// at any time — see getLatestUnitCost in src/lib/stock.ts); Milk & Mote has no cost
// data, so its revenue is added in full, then reduced by the deductions above.
// Distinct from DailyRecordRow.totalRevenue, which is sold revenue plus unsold/"left"
// stock value, not profit — that one feeds the daily-winner comparison in
// landing-data.ts and is intentionally left untouched.
//
// Deliberately kept in its own, Prisma-free module (not landing-data.ts): this is
// imported by a client component (SaleRecordsSection), and landing-data.ts also
// exports the Prisma-backed getLandingPageData — importing from it client-side
// bundled @prisma/client into the browser chunk.
export function recordAdjustedRevenue(
  row: DailyRecordRow,
  unitCosts: UnitCosts,
  deductions?: MilkGrainsDeductions,
): number {
  const quesoProfit = row.queso.revenue - row.queso.sold * unitCosts.QUESO;
  const yogurtProfit = row.yogurt.revenue - row.yogurt.sold * unitCosts.YOGURT;
  const milkCost = deductions?.milkCostByUserId[row.userId] ?? 0;
  const grainsShare = deductions?.grainsShareByDate[row.date] ?? 0;

  return quesoProfit + yogurtProfit + row.milkMoteRevenue - milkCost - grainsShare;
}

export function buildAdjustedRevenueTotal(
  records: DailyRecordRow[],
  unitCosts: UnitCosts,
  deductions?: MilkGrainsDeductions,
): number {
  return records.reduce((sum, r) => sum + recordAdjustedRevenue(r, unitCosts, deductions), 0);
}
