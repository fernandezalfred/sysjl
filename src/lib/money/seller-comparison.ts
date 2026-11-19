import { bucketKey, type Granularity } from "@/lib/date-buckets";
import { sellerPay } from "@/lib/money/seller-pay";
import { recordAdjustedRevenue, type GrainsDeductions, type UnitCosts } from "@/lib/money/revenue";
import type { DailyRecordRow } from "@/types/daily-records";

// Prisma-free: Ingresos y egresos computes these in the browser.

export interface EqualDaysSeller {
  userId: string;
  userName: string;
  // Days worked in the period; only the last `days` of them are counted.
  daysWorked: number;
  // Neto − Pago over those days: what the seller made the company earn.
  result: number;
  // Neto − Pago of each counted day, oldest first (day 1 … day N); sums to `result`.
  byDay: { date: string; result: number }[];
}

export interface EqualDaysComparison {
  // The fewest days any seller worked in the period: everyone is compared over this many.
  days: number;
  sellers: EqualDaysSeller[];
}

// A record's Neto − Pago, the figure under the seller's name in Sale Records.
function recordResult(row: DailyRecordRow, unitCosts: UnitCosts, deductions: GrainsDeductions): number {
  return recordAdjustedRevenue(row, unitCosts, deductions) - sellerPay(row.totalSold);
}

// Sellers compared over the same number of days worked, so a bonus goes to whoever
// made the company earn the most and not to whoever worked more days: in the period
// (a bucketKey; null = since the beginning) each seller counts only their last N days
// worked, N being the fewest days any seller worked there (e.g. 8 and 4 days → each
// one's last 4). A seller with no record in the period is left out. Best first.
export function buildEqualDaysComparison(
  rows: DailyRecordRow[],
  unitCosts: UnitCosts,
  deductions: GrainsDeductions,
  granularity: Granularity,
  period: string | null,
): EqualDaysComparison {
  const bySeller = new Map<string, { userName: string; rows: DailyRecordRow[] }>();
  for (const r of rows) {
    if (period !== null && bucketKey(r.date, granularity) !== period) continue;
    const seller = bySeller.get(r.userId) ?? { userName: r.userName, rows: [] };
    seller.rows.push(r);
    bySeller.set(r.userId, seller);
  }
  if (bySeller.size === 0) return { days: 0, sellers: [] };

  const days = Math.min(...[...bySeller.values()].map((s) => s.rows.length));
  const sellers = [...bySeller.entries()].map(([userId, s]) => {
    const byDay = [...s.rows]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days)
      .reverse()
      .map((r) => ({ date: r.date, result: recordResult(r, unitCosts, deductions) }));
    const result = byDay.reduce((sum, d) => sum + d.result, 0);
    return { userId, userName: s.userName, daysWorked: s.rows.length, result, byDay };
  });
  sellers.sort((a, b) => b.result - a.result || a.userName.localeCompare(b.userName));
  return { days, sellers };
}

export interface PeriodNetProfit {
  // bucketKey: YYYY-MM-DD (the day or its week's Monday) or YYYY-MM.
  period: string;
  // Sum of the period's records' Neto (before pay).
  netProfit: number;
}

// The company's total Neto per day, week or month, oldest first; a period appears
// when it has a sale record.
export function buildNetProfitByPeriod(
  rows: DailyRecordRow[],
  unitCosts: UnitCosts,
  deductions: GrainsDeductions,
  granularity: Granularity,
): PeriodNetProfit[] {
  const byPeriod = new Map<string, number>();
  for (const r of rows) {
    const key = bucketKey(r.date, granularity);
    byPeriod.set(key, (byPeriod.get(key) ?? 0) + recordAdjustedRevenue(r, unitCosts, deductions));
  }
  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, netProfit]) => ({ period, netProfit }));
}

export interface PeriodTotals {
  // Sale records in the period (one per seller per day).
  records: number;
  // Every seller's Pago, each day by its own tier: what the workers earned.
  pay: number;
  // Neto − Pago of every record: the company's net profit after the workers' pay.
  result: number;
  // Each seller's Pago (paid or not), Neto − Pago and days worked in the period,
  // most pay earned first.
  bySeller: { userId: string; userName: string; pay: number; result: number; days: number }[];
}

// Totals of every seller's records in the period (a bucketKey; null = since the
// beginning), every day worked counted.
export function buildPeriodTotals(
  rows: DailyRecordRow[],
  unitCosts: UnitCosts,
  deductions: GrainsDeductions,
  granularity: Granularity,
  period: string | null,
): PeriodTotals {
  const totals: PeriodTotals = { records: 0, pay: 0, result: 0, bySeller: [] };
  const bySeller = new Map<string, PeriodTotals["bySeller"][number]>();
  for (const r of rows) {
    if (period !== null && bucketKey(r.date, granularity) !== period) continue;
    const pay = sellerPay(r.totalSold);
    const result = recordResult(r, unitCosts, deductions);
    totals.records += 1;
    totals.pay += pay;
    totals.result += result;
    const seller = bySeller.get(r.userId) ?? { userId: r.userId, userName: r.userName, pay: 0, result: 0, days: 0 };
    seller.pay += pay;
    seller.result += result;
    seller.days += 1;
    bySeller.set(r.userId, seller);
  }
  totals.bySeller = [...bySeller.values()].sort((a, b) => b.pay - a.pay || a.userName.localeCompare(b.userName));
  return totals;
}

