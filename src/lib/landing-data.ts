import { prisma } from "@/lib/prisma";
import { PRODUCT_LABELS } from "@/lib/pricing";
import type {
  DailyRecordRow,
  LandingPageData,
  ProductBreakdown,
  ProductCode,
  ProductTotal,
  SaleRecord,
  UserTotal,
} from "@/types/landing";

const PRODUCT_CODES: ProductCode[] = ["QUESO", "YOGURT"];

export function buildUserTotals(records: SaleRecord[]): UserTotal[] {
  // One row per user per day, reusing buildDailyRecords' totalRevenue (which already
  // includes Milk & Mote and unsold Queso/Yogurt value) and its isDailyWinner flag,
  // so "winner" means the same thing here as it does in the Sale Records table.
  const rows: UserTotal[] = buildDailyRecords(records).map((row) => ({
    date: row.date,
    userId: row.userId,
    userName: row.userName,
    quesoRevenue: row.queso.revenue,
    yogurtRevenue: row.yogurt.revenue,
    milkMoteRevenue: row.milkMoteRevenue,
    totalRevenue: row.totalRevenue,
    isDailyWinner: row.isDailyWinner,
    winnerMargin: row.winnerMargin,
  }));

  // Most recent day first; same-day ties keep buildDailyRecords' own ordering.
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

// Revenue and remaining value are summed per record using each record's own
// unitPrice (snapshotted at the time it was created), not today's current price —
// so a later admin price change never rewrites a past record's figures here.
export function buildProductTotals(records: SaleRecord[]): ProductTotal[] {
  return PRODUCT_CODES.map((product) => {
    const productRecords = records.filter((r) => r.product === product);
    const quantitySold = productRecords.reduce(
      (sum, r) => sum + (r.quantityTaken - r.quantityRemaining),
      0,
    );
    const quantityRemaining = productRecords.reduce((sum, r) => sum + r.quantityRemaining, 0);
    const revenue = productRecords.reduce(
      (sum, r) => sum + (r.quantityTaken - r.quantityRemaining) * r.unitPrice,
      0,
    );
    const remainingValue = productRecords.reduce((sum, r) => sum + r.quantityRemaining * r.unitPrice, 0);

    return {
      product,
      label: PRODUCT_LABELS[product],
      quantitySold,
      revenue,
      quantityRemaining,
      remainingValue,
    };
  });
}

const EMPTY_BREAKDOWN: ProductBreakdown = { taken: 0, remaining: 0, sold: 0, revenue: 0, remainingValue: 0 };

type PartialDailyRecordRow = Omit<
  DailyRecordRow,
  "milkMoteRevenue" | "totalRevenue" | "isDailyWinner" | "winnerMargin"
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
      createdAt: record.createdAt,
      date: record.date,
      userId: record.userId,
      userName: record.userName,
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
    return {
      ...row,
      isDailyWinner: hasCompetitor && row.totalRevenue === max,
      winnerMargin: runnerUp === undefined ? null : max - runnerUp,
    };
  });

  // Newest-created record first, so a record just added always lands on line one.
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLandingPageData(): Promise<LandingPageData> {
  const workRecords = await prisma.dailyWorkRecord.findMany({
    include: { user: { include: { vehicle: true } } },
  });

  const records: SaleRecord[] = workRecords.flatMap((r) => {
    const base = {
      date: r.date.toISOString().slice(0, 10),
      userId: r.userId,
      userName: r.user.name,
      vehicleId: r.user.vehicle?.id ?? "",
      vehicleName: r.user.vehicle?.name ?? "No vehicle",
      totalSold: r.totalSold,
      createdAt: r.createdAt.toISOString(),
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

  const productTotals = buildProductTotals(records);
  const userTotals = buildUserTotals(records);
  const dailyRecords = buildDailyRecords(records);

  return {
    dailyRecords,
    productTotals,
    userTotals,
    grandTotalQuantitySold: productTotals.reduce((sum, p) => sum + p.quantitySold, 0),
    grandTotalRevenue: productTotals.reduce((sum, p) => sum + p.revenue, 0),
    grandTotalRemainingQuantity: productTotals.reduce((sum, p) => sum + p.quantityRemaining, 0),
    grandTotalRemainingValue: productTotals.reduce((sum, p) => sum + p.remainingValue, 0),
    generatedAt: new Date().toISOString(),
  };
}
