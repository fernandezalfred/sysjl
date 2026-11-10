import { prisma } from "@/lib/prisma";
import type {
  DailyRecordRow,
  DailyRecordsData,
  ProductBreakdown,
  SaleRecord,
  UserTotal,
} from "@/types/daily-records";

export function buildUserTotals(records: SaleRecord[]): UserTotal[] {
  // One row per user per day, reusing buildDailyRecords' totalRevenue (which already
  // includes Milk & Mote and unsold Queso/Yogurt value) and its isDailyWinner flag,
  // so "winner" means the same thing here as it does in the Sale Records table.
  const rows: UserTotal[] = buildDailyRecords(records).map((row) => ({
    date: row.date,
    payPaid: row.payPaid,
    userId: row.userId,
    userName: row.userName,
    queso: row.queso,
    yogurt: row.yogurt,
    milkMoteRevenue: row.milkMoteRevenue,
    totalRevenue: row.totalRevenue,
    isDailyWinner: row.isDailyWinner,
    winnerMargin: row.winnerMargin,
    lossMargin: row.lossMargin,
  }));

  // Most recent day first; same-day ties keep buildDailyRecords' own ordering.
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

const EMPTY_BREAKDOWN: ProductBreakdown = { taken: 0, remaining: 0, sold: 0, revenue: 0, remainingValue: 0 };

type PartialDailyRecordRow = Omit<
  DailyRecordRow,
  "milkMoteRevenue" | "totalRevenue" | "isDailyWinner" | "winnerMargin" | "lossMargin"
>;

export function buildDailyRecords(records: SaleRecord[]): DailyRecordRow[] {
  const rowMap = new Map<string, PartialDailyRecordRow>();

  for (const record of records) {
    const key = `${record.date}|${record.userId}`;
    const sold = record.quantityTaken - record.quantityRemaining;
    const breakdown: ProductBreakdown = {
      taken: record.quantityTaken,
      remaining: record.quantityRemaining,
      sold,
      revenue: sold * record.unitPrice,
      remainingValue: record.quantityRemaining * record.unitPrice,
    };
    const field = record.product === "QUESO" ? "queso" : "yogurt";

    const existing = rowMap.get(key);
    if (existing) {
      existing[field] = breakdown;
      continue;
    }

    rowMap.set(key, {
      id: key,
      workRecordId: record.workRecordId,
      totalSold: record.totalSold,
      payPaid: record.payPaid,
      createdAt: record.createdAt,
      date: record.date,
      userId: record.userId,
      userName: record.userName,
      milkLiters: record.milkLiters,
      milkUnitCost: record.milkUnitCost,
      queso: field === "queso" ? breakdown : EMPTY_BREAKDOWN,
      yogurt: field === "yogurt" ? breakdown : EMPTY_BREAKDOWN,
    });
  }

  const withRevenue = Array.from(rowMap.values()).map((row) => {
    // Milk + Mote have no dedicated taken/sold inputs; their combined revenue is
    // the remainder of the user-entered totalSold after Queso's and Yogurt's
    // own quantity-based revenue is accounted for.
    const milkMoteRevenue = row.totalSold - row.queso.revenue - row.yogurt.revenue;
    const totalRevenue =
      row.queso.revenue +
      row.queso.remainingValue +
      row.yogurt.revenue +
      row.yogurt.remainingValue +
      milkMoteRevenue;

    return { ...row, milkMoteRevenue, totalRevenue };
  });

  // The day's winner is whoever has the highest totalRevenue ("value": sold revenue
  // plus the Bs value of unsold/"left" Queso and Yogurt stock). Ties share the win.
  // Determined per date, independently of other days.
  const countByDate = new Map<string, number>();
  const maxRevenueByDate = new Map<string, number>();
  for (const row of withRevenue) {
    countByDate.set(row.date, (countByDate.get(row.date) ?? 0) + 1);
    const currentMax = maxRevenueByDate.get(row.date);
    if (currentMax === undefined || row.totalRevenue > currentMax) {
      maxRevenueByDate.set(row.date, row.totalRevenue);
    }
  }

  // How much the winner won by: the gap between the day's highest totalRevenue and
  // the best non-winning totalRevenue that same day. null when there is no competitor
  // to compare against (a single record that day, or every record tied for the win).
  const runnerUpRevenueByDate = new Map<string, number>();
  for (const row of withRevenue) {
    const max = maxRevenueByDate.get(row.date)!;
    if (row.totalRevenue < max) {
      const currentRunnerUp = runnerUpRevenueByDate.get(row.date);
      if (currentRunnerUp === undefined || row.totalRevenue > currentRunnerUp) {
        runnerUpRevenueByDate.set(row.date, row.totalRevenue);
      }
    }
  }

  const rows: DailyRecordRow[] = withRevenue.map((row) => {
    // A day needs at least two records to have a winner at all — nothing to compare
    // a lone record against, so it is not marked a winner.
    const hasCompetitor = countByDate.get(row.date)! > 1;
    const max = maxRevenueByDate.get(row.date)!;
    const runnerUp = runnerUpRevenueByDate.get(row.date);
    const isDailyWinner = hasCompetitor && row.totalRevenue === max;
    return {
      ...row,
      isDailyWinner,
      winnerMargin: runnerUp === undefined ? null : max - runnerUp,
      // A loser is anyone below the day's winner; how far behind the winner they ended.
      lossMargin: hasCompetitor && !isDailyWinner ? max - row.totalRevenue : null,
    };
  });

  // Newest-created record first, so a record just added always lands on line one.
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// The rows (Sale Records or Totals by User) a signed-in viewer may see: admins every row,
// a seller only their own, no user id none.
export function recordsVisibleTo<T extends { userId: string }>(rows: T[], userId: string | null, isAdmin: boolean): T[] {
  if (isAdmin) return rows;
  if (!userId) return [];
  return rows.filter((row) => row.userId === userId);
}

// The Milk liters and price are cost data: guests get the rows without them.
export function withoutMilkCost(rows: DailyRecordRow[]): DailyRecordRow[] {
  return rows.map((row) => ({ ...row, milkLiters: 0, milkUnitCost: 0 }));
}

export async function getDailyRecordsData(): Promise<DailyRecordsData> {
  const workRecords = await prisma.dailyWorkRecord.findMany({
    include: { user: true },
  });

  const records: SaleRecord[] = workRecords.flatMap((r) => {
    const base = {
      date: r.date.toISOString().slice(0, 10),
      userId: r.userId,
      userName: r.user.name,
      totalSold: r.totalSold,
      payPaid: Boolean(r.payPaidAt),
      createdAt: r.createdAt.toISOString(),
      milkLiters: r.milkLiters,
      milkUnitCost: r.milkUnitCost,
    };

    return [
      {
        ...base,
        id: `${r.id}-QUESO`,
        workRecordId: r.id,
        product: "QUESO" as const,
        // The price snapshotted on this record at creation time, not today's price.
        unitPrice: r.quesoSalePrice,
        quantityTaken: r.quesoTaken,
        quantityRemaining: r.quesoRemaining,
      },
      {
        ...base,
        id: `${r.id}-YOGURT`,
        workRecordId: r.id,
        product: "YOGURT" as const,
        unitPrice: r.yogurtSalePrice,
        quantityTaken: r.yogurtTaken,
        quantityRemaining: r.yogurtRemaining,
      },
    ];
  });

  return {
    dailyRecords: buildDailyRecords(records),
    userTotals: buildUserTotals(records),
    generatedAt: new Date().toISOString(),
  };
}
