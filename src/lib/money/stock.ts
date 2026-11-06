import { prisma } from "@/lib/prisma";
import { formatBusinessDateKey } from "@/lib/dates";
import { milkCostKey } from "@/lib/money/revenue";
import type { Product } from "@prisma/client";

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

// Each driver's Milk purchase cost (quantity*unitCost) per business calendar day (Bolivia),
// keyed by milkCostKey(userId, YYYY-MM-DD) — so a sale record only deducts the
// Milk bought for its own driver on its own day, never a later or earlier purchase.
// Milk has no per-record sold quantity to cost against directly (unlike Queso/
// Yogurt's taken/remaining fields). A driver/day with no Milk purchase has no key (0).
export async function getMilkCostByUserAndDay(): Promise<Record<string, number>> {
  const purchases = await prisma.stockPurchase.findMany({
    where: { product: "MILK", forUserId: { not: null } },
    select: { quantity: true, unitCost: true, createdAt: true, forUserId: true },
  });

  const result: Record<string, number> = {};
  for (const purchase of purchases) {
    if (!purchase.forUserId) continue;
    const key = milkCostKey(purchase.forUserId, formatBusinessDateKey(purchase.createdAt));
    result[key] = (result[key] ?? 0) + purchase.quantity * purchase.unitCost;
  }
  return result;
}

// Total grain purchase cost (quantity*unitCost across all three grain items),
// grouped by the business calendar day (Bolivia) the purchase was made — used to split a day's
// grains cost evenly across however many drivers have a work record that day.
export async function getGrainsCostByDay(): Promise<Record<string, number>> {
  const purchases = await prisma.stockPurchase.findMany({
    where: { product: { in: GRAIN_PRODUCTS } },
    select: { quantity: true, unitCost: true, createdAt: true },
  });

  const result: Record<string, number> = {};
  for (const purchase of purchases) {
    const key = formatBusinessDateKey(purchase.createdAt);
    result[key] = (result[key] ?? 0) + purchase.quantity * purchase.unitCost;
  }
  return result;
}
