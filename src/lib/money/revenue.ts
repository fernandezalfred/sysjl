import { netProfitAfterPay } from "@/lib/money/seller-pay";
import type { DailyRecordRow, ProductCode } from "@/types/daily-records";

export type UnitCosts = Record<ProductCode, number>;

// A record's purchase cost per unit: the one snapshotted on it when it was created,
// or — for older records without a snapshot — the current cost.
export function recordUnitCost(row: Pick<DailyRecordRow, "purchaseCosts">, product: ProductCode, unitCosts: UnitCosts): number {
  return row.purchaseCosts?.[product] ?? unitCosts[product];
}

// Per-day deduction applied on top of the profit below: `grainsShareByDate` is a
// day's total grain purchase cost split evenly across that day's work records
// (getGrainsCostByDay in src/lib/money/stock.ts, divided by that day's record count).
// 0 for a day with no grain purchase.
export interface GrainsDeductions {
  grainsShareByDate: Record<string, number>;
}

// Profit actually earned on one record: for Queso and Yogurt, each sold unit's
// margin is its snapshotted sale price minus its purchase cost (snapshotted on the
// record too; older records fall back to the current cost passed in — see
// recordUnitCost); Milk & Mote has no cost
// data, so its revenue is added in full, then reduced by the record's own Milk cost
// (liters × price per liter, entered on the record) and the grains share above.
// Distinct from DailyRecordRow.totalRevenue, which is sold revenue plus unsold/"left"
// stock value, not profit — that one feeds the daily-winner comparison in
// daily-records.ts and is intentionally left untouched.
//
// Deliberately kept in its own, Prisma-free module (not daily-records.ts): this is
// imported by a client component (SaleRecordsSection), and daily-records.ts also
// exports the Prisma-backed getDailyRecordsData — importing from it client-side
// bundled @prisma/client into the browser chunk.

export function recordAdjustedRevenue(
  row: DailyRecordRow,
  unitCosts: UnitCosts,
  deductions?: GrainsDeductions,
): number {
  const quesoProfit = row.queso.revenue - row.queso.sold * recordUnitCost(row, "QUESO", unitCosts);
  const yogurtProfit = row.yogurt.revenue - row.yogurt.sold * recordUnitCost(row, "YOGURT", unitCosts);
  const milkCost = row.milkLiters * row.milkUnitCost;
  const grainsShare = deductions?.grainsShareByDate[row.date] ?? 0;

  // Rounded to whole bolivianos, like every Net profit figure.
  return Math.round(quesoProfit + yogurtProfit + row.milkMoteRevenue - milkCost - grainsShare);
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
    // Each seller's share is rounded to whole bolivianos.
    result[date] = Math.round(total / (recordCountByDate.get(date) ?? 1));
  }
  return result;
}

// A day's total Net profit after paying the sellers: the sum, over that day's records,
// of each record's Net profit minus its seller pay (the same "Neto − Pago"
// shown under each seller's name), keyed by YYYY-MM-DD. Shown in each day header of
// Sale Records and Totals by User (admin-only, like every Net profit figure). Since
// grains are split evenly across the day's records, the sum deducts the day's full
// grains cost.
export function buildNetProfitAfterPayByDate(
  rows: DailyRecordRow[],
  unitCosts: UnitCosts,
  deductions?: GrainsDeductions,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const netProfit = recordAdjustedRevenue(row, unitCosts, deductions);
    result[row.date] = (result[row.date] ?? 0) + netProfitAfterPay(netProfit, row.totalSold);
  }
  return result;
}
