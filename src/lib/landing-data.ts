import { prisma } from "@/lib/prisma";
import { CURRENT_UNIT_PRICE, PRODUCT_LABELS } from "@/lib/pricing";
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
  const userMap = new Map<string, UserTotal>();

  for (const record of records) {
    const sold = record.quantityTaken - record.quantityRemaining;
    const revenue = sold * record.unitPrice;
    const existing = userMap.get(record.userId);

    if (existing) {
      existing.quantitySoldByProduct[record.product] += sold;
      existing.totalQuantitySold += sold;
      existing.totalRevenue += revenue;
      continue;
    }

    userMap.set(record.userId, {
      userId: record.userId,
      userName: record.userName,
      quantitySoldByProduct: { QUESO: 0, YOGURT: 0, [record.product]: sold },
      totalQuantitySold: sold,
      totalRevenue: revenue,
    });
  }

  return Array.from(userMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function buildProductTotals(records: SaleRecord[]): ProductTotal[] {
  return PRODUCT_CODES.map((product) => {
    const productRecords = records.filter((r) => r.product === product);
    const quantitySold = productRecords.reduce(
      (sum, r) => sum + (r.quantityTaken - r.quantityRemaining),
      0,
    );
    const quantityRemaining = productRecords.reduce((sum, r) => sum + r.quantityRemaining, 0);
    const unitPrice = CURRENT_UNIT_PRICE[product];

    return {
      product,
      label: PRODUCT_LABELS[product],
      quantitySold,
      revenue: quantitySold * unitPrice,
      quantityRemaining,
      remainingValue: quantityRemaining * unitPrice,
    };
  });
}

const EMPTY_BREAKDOWN: ProductBreakdown = { taken: 0, remaining: 0, sold: 0, revenue: 0, remainingValue: 0 };

type PartialDailyRecordRow = Omit<DailyRecordRow, "milkMoteRevenue" | "totalRevenue">;

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

  const rows: DailyRecordRow[] = Array.from(rowMap.values()).map((row) => {
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
        unitPrice: CURRENT_UNIT_PRICE.QUESO,
        quantityTaken: r.quesoTaken,
        quantityRemaining: r.quesoRemaining,
      },
      {
        ...base,
        id: `${r.id}-YOGURT`,
        workRecordId: r.id,
        product: "YOGURT" as const,
        unitPrice: CURRENT_UNIT_PRICE.YOGURT,
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
