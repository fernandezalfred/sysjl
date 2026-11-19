import { prisma } from "@/lib/prisma";
import { formatBusinessDateKey } from "@/lib/dates";
import type { Product } from "@prisma/client";

const GRAIN_PRODUCTS: Product[] = ["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"];

// The most recent StockPurchase entry's unitCost. Only a fallback for Queso/Yogurt
// now: their purchase cost is set on /dashboard (ProductPrice.purchaseCost), and
// this keeps the cost of their last recorded purchase until the admin sets one.
export async function getLatestUnitCost(product: Product, companyId: string): Promise<number> {
  const latest = await prisma.stockPurchase.findFirst({
    where: { companyId, product },
    orderBy: { createdAt: "desc" },
    select: { unitCost: true },
  });

  return latest?.unitCost ?? 0;
}

// Total grain purchase cost (quantity × unitCost, all three grain items) per business
// day (Bolivia) — used to split a day's grains cost evenly across however many
// drivers have a work record that day.
export async function getGrainsCostByDay(companyId: string): Promise<Record<string, number>> {
  const purchases = await prisma.stockPurchase.findMany({
    where: { companyId, product: { in: GRAIN_PRODUCTS } },
    select: { quantity: true, unitCost: true, createdAt: true },
  });

  const result: Record<string, number> = {};
  for (const purchase of purchases) {
    const key = formatBusinessDateKey(purchase.createdAt);
    result[key] = (result[key] ?? 0) + purchase.quantity * purchase.unitCost;
  }
  return result;
}
