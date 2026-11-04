import { bucketKey, type Granularity } from "@/lib/date-buckets";
import type { DailyRecordRow } from "@/types/landing";

export interface UserSalesTotal {
  userId: string;
  userName: string;
  // Total venta (Bs).
  total: number;
  // Total venta plus the value of unsold Queso and Yogurt (Bs).
  totalWithUnsold: number;
}

export interface UserSalesPeriod {
  // Period key from bucketKey: YYYY-MM-DD (day or the week's Monday) or YYYY-MM.
  period: string;
  users: UserSalesTotal[];
}

export interface ProductDaySales {
  sold: number;
  revenue: number;
  // Units left over at the end of the day and their value at the record's sale price.
  remaining: number;
  remainingValue: number;
}

export interface UserProductSales {
  userId: string;
  userName: string;
  queso: ProductDaySales;
  yogurt: ProductDaySales;
  milkMoteRevenue: number;
  // The record's Total venta (Bs, all products).
  totalSold: number;
  // Total venta plus the value of unsold Queso and Yogurt.
  totalRevenue: number;
}

function productDaySales(p: DailyRecordRow["queso"]): ProductDaySales {
  return { sold: p.sold, revenue: p.revenue, remaining: p.remaining, remainingValue: p.remainingValue };
}

// Most recent day that has at least one Sale Record (YYYY-MM-DD), or null if none.
export function latestWorkDay(records: Pick<DailyRecordRow, "date">[]): string | null {
  return records.reduce<string | null>((max, r) => (max === null || r.date > max ? r.date : max), null);
}

// Each user's total sales (totalSold, Bs) and Total sold + unsold (totalRevenue, Bs)
// in the day, week, or month that contains `day` (a day picked in the records list),
// or the latest work day when none is given — so the chart always shows a period
// that has data, even early in a new week or month. Sorted highest first; users with
// no record in the period are left out.
export function buildUserSalesByPeriod(
  records: DailyRecordRow[],
  granularity: Granularity,
  day: string | null = null,
): UserSalesPeriod | null {
  const anchor = day ?? latestWorkDay(records);
  if (anchor === null) return null;

  const period = bucketKey(anchor, granularity);
  const totals = new Map<string, UserSalesTotal>();
  for (const r of records) {
    if (bucketKey(r.date, granularity) !== period) continue;
    const current = totals.get(r.userId) ?? { userId: r.userId, userName: r.userName, total: 0, totalWithUnsold: 0 };
    current.total += r.totalSold;
    current.totalWithUnsold += r.totalRevenue;
    totals.set(r.userId, current);
  }

  const users = Array.from(totals.values()).sort((a, b) => b.total - a.total || a.userName.localeCompare(b.userName));
  return { period, users };
}

// What each user sold and had left over on `day`, or the latest work day when none
// is given, per product, in Bs (units × the record's own sale price). Milk and Mote
// are recorded together as one figure and have no leftover tracking.
export function buildLastDayProductSales(
  records: DailyRecordRow[],
  day: string | null = null,
): { date: string; users: UserProductSales[] } | null {
  const anchor = day ?? latestWorkDay(records);
  if (anchor === null) return null;

  const users = records
    .filter((r) => r.date === anchor)
    .map((r) => ({
      userId: r.userId,
      userName: r.userName,
      queso: productDaySales(r.queso),
      yogurt: productDaySales(r.yogurt),
      milkMoteRevenue: r.milkMoteRevenue,
      totalSold: r.totalSold,
      totalRevenue: r.totalRevenue,
    }))
    .sort((a, b) => a.userName.localeCompare(b.userName));

  return { date: anchor, users };
}

export interface UserTrendSeries {
  userId: string;
  userName: string;
  // One value per entry in UserTrend.periods; 0 where the user has no record.
  totals: number[];
}

export interface UserTrend {
  // Period keys from bucketKey, oldest first.
  periods: string[];
  // Sorted by name so each user keeps the same color whatever the period.
  series: UserTrendSeries[];
}

// Each user's Total sold + unsold (DailyRecordRow.totalRevenue) summed per day,
// week, or month, across every record.
export function buildUserTrend(records: DailyRecordRow[], granularity: Granularity): UserTrend {
  const periods = Array.from(new Set(records.map((r) => bucketKey(r.date, granularity)))).sort();
  const index = new Map(periods.map((p, i) => [p, i]));
  const byUser = new Map<string, UserTrendSeries>();

  for (const r of records) {
    const series = byUser.get(r.userId) ?? { userId: r.userId, userName: r.userName, totals: periods.map(() => 0) };
    series.totals[index.get(bucketKey(r.date, granularity))!] += r.totalRevenue;
    byUser.set(r.userId, series);
  }

  const series = Array.from(byUser.values()).sort((a, b) => a.userName.localeCompare(b.userName));
  return { periods, series };
}

export interface SalesChartsData {
  userSalesByPeriod: Record<Granularity, UserSalesPeriod> | null;
  lastDayProductSales: { date: string; users: UserProductSales[] } | null;
  userTrends: Record<Granularity, UserTrend>;
}

// Everything the Sales by User charts need, from the same records Sale Records
// shows — shared by the public landing page and /dashboard. `selectedDay` is the day
// picked in the records list; null means the latest work day. The trend chart
// always covers every record.
export function buildSalesChartsData(records: DailyRecordRow[], selectedDay: string | null = null): SalesChartsData {
  const day = buildUserSalesByPeriod(records, "day", selectedDay);
  const week = buildUserSalesByPeriod(records, "week", selectedDay);
  const month = buildUserSalesByPeriod(records, "month", selectedDay);

  return {
    userSalesByPeriod: day && week && month ? { day, week, month } : null,
    lastDayProductSales: buildLastDayProductSales(records, selectedDay),
    userTrends: {
      day: buildUserTrend(records, "day"),
      week: buildUserTrend(records, "week"),
      month: buildUserTrend(records, "month"),
    },
  };
}
