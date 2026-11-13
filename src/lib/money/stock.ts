import { prisma } from "@/lib/prisma";
import { formatBusinessDateKey } from "@/lib/dates";
import type { Product } from "@prisma/client";
import type { GrainProduct } from "@/types/admin";
import { emptyGrainCosts, grainsTotalByDay, type GrainCosts } from "@/lib/money/finance";

const GRAIN_PRODUCTS: Product[] = ["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"];

// The most recent StockPurchase entry's unitCost. Only a fallback for Queso/Yogurt
// now: their purchase cost is set on /dashboard (ProductPrice.purchaseCost), and
// this keeps the cost of their last recorded purchase until the admin sets one.
export async function getLatestUnitCost(product: Product): Promise<number> {
  const latest = await prisma.stockPurchase.findFirst({
    where: { product },
    orderBy: { createdAt: "desc" },
    select: { unitCost: true },
  });

  return latest?.unitCost ?? 0;
}

// Grain purchase cost (quantity × unitCost) per grain item, grouped by the business
// calendar day (Bolivia) the purchase was made. Feeds the per-grain investment on
// /admin/finance.
export async function getGrainsCostByDayAndProduct(): Promise<Record<string, GrainCosts>> {
  const purchases = await prisma.stockPurchase.findMany({
    where: { product: { in: GRAIN_PRODUCTS } },
    select: { product: true, quantity: true, unitCost: true, createdAt: true },
  });

  const result: Record<string, GrainCosts> = {};
  for (const purchase of purchases) {
    const key = formatBusinessDateKey(purchase.createdAt);
    const day = (result[key] ??= emptyGrainCosts());
    day[purchase.product as GrainProduct] += purchase.quantity * purchase.unitCost;
  }
  return result;
}

// Total grain purchase cost (all three grain items) per business day — used to split
// a day's grains cost evenly across however many drivers have a work record that day.
export async function getGrainsCostByDay(): Promise<Record<string, number>> {
  return grainsTotalByDay(await getGrainsCostByDayAndProduct());
}
