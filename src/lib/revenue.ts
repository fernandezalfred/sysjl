import type { DailyRecordRow, ProductCode } from "@/types/landing";

export type UnitCosts = Record<ProductCode, number>;

// Per-driver/per-day deductions applied on top of the Queso/Yogurt/Milk&Mote profit
// below. Milk and grains have no per-record sold-quantity tracking, so these are
// approximations rather than exact per-unit costs: `milkCostByUserDay` is a
// driver's total Milk purchase cost (quantity*unitCost) on the record's own day,
// keyed by milkCostKey(userId, date) (from getMilkCostByUserAndDay in
// src/lib/stock.ts), and `grainsShareByDate` is a given
// day's total grain purchase cost split evenly across that day's work records
// (getGrainsCostByDay in src/lib/stock.ts, divided by that day's record count).
// Both default to 0 for a user/day with no matching purchase.
export interface MilkGrainsDeductions {
  milkCostByUserDay: Record<string, number>;
  grainsShareByDate: Record<string, number>;
}

// Key for MilkGrainsDeductions.milkCostByUserDay: one driver on one YYYY-MM-DD day.
export function milkCostKey(userId: string, date: string): string {
  return `${userId}|${date}`;
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
  const milkCost = deductions?.milkCostByUserDay[milkCostKey(row.userId, row.date)] ?? 0;
  const grainsShare = deductions?.grainsShareByDate[row.date] ?? 0;

  return quesoProfit + yogurtProfit + row.milkMoteRevenue - milkCost - grainsShare;
}

// Grains cost is tracked per purchase day, not per driver — split evenly across
// however many drivers actually have a work record that same day, so the full
// day's grains cost isn't deducted multiple times when several drivers worked it.
export function buildGrainsShareByDate(
  grainsCostByDay: Record<string, number>,
  records: Pick<DailyRecordRow, "date">[],
): Record<string, number> {
  const recordCountByDate = new Map<string, number>();
  for (const r of records) {
    recordCountByDate.set(r.date, (recordCountByDate.get(r.date) ?? 0) + 1);
  }
  const result: Record<string, number> = {};
  for (const [date, total] of Object.entries(grainsCostByDay)) {
    result[date] = total / (recordCountByDate.get(date) ?? 1);
  }
  return result;
}
