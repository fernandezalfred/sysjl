import type { DailyRecordRow, ProductCode } from "@/types/landing";

export type UnitCosts = Record<ProductCode, number>;

// Profit actually earned on one record: for Queso and Yogurt, each sold unit's
// margin is its snapshotted sale price minus the product's purchase cost (passed
// in, not hardcoded, since the admin can record a new purchase at a different cost
// at any time — see getLatestUnitCost in src/lib/stock.ts); Milk & Mote has no cost
// data, so its revenue is added in full. Distinct from DailyRecordRow.totalRevenue,
// which is sold revenue plus unsold/"left" stock value, not profit — that one feeds
// the daily-winner comparison in landing-data.ts and is intentionally left untouched.
//
// Deliberately kept in its own, Prisma-free module (not landing-data.ts): this is
// imported by a client component (SaleRecordsSection), and landing-data.ts also
// exports the Prisma-backed getLandingPageData — importing from it client-side
// bundled @prisma/client into the browser chunk.
export function recordAdjustedRevenue(row: DailyRecordRow, unitCosts: UnitCosts): number {
  const quesoProfit = row.queso.revenue - row.queso.sold * unitCosts.QUESO;
  const yogurtProfit = row.yogurt.revenue - row.yogurt.sold * unitCosts.YOGURT;

  return quesoProfit + yogurtProfit + row.milkMoteRevenue;
}

export function buildAdjustedRevenueTotal(records: DailyRecordRow[], unitCosts: UnitCosts): number {
  return records.reduce((sum, r) => sum + recordAdjustedRevenue(r, unitCosts), 0);
}
