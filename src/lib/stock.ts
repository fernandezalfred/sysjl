import { prisma } from "@/lib/prisma";
import { formatDateKey } from "@/lib/dates";
import { milkCostKey } from "@/lib/revenue";
import type { Product } from "@prisma/client";

const GRAIN_PRODUCTS: Product[] = ["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"];

// Current deposit stock for a product is derived, not stored. For Queso and Yogurt,
// which have taken/remaining quantities on DailyWorkRecord, it's total purchased minus
// total sold (taken - remaining): a unit taken from the deposit leaves it, a unit
// reported back as remaining returns to it, so the two cancel out and only what
// actually sold reduces stock permanently. Other products (e.g. Milk) have no
// quantity-level sales tracking anywhere yet, so their stock reflects purchases only —
// it is never auto-deducted, only corrected via editing/deleting purchase entries.
export async function getCurrentStock(product: Product): Promise<number> {
  const purchased = await prisma.stockPurchase.aggregate({
    where: { product },
    _sum: { quantity: true },
  });
  const totalPurchased = purchased._sum.quantity ?? 0;

  if (product !== "QUESO" && product !== "YOGURT") {
    return totalPurchased;
  }

  const workRecords = await prisma.dailyWorkRecord.aggregate({
    _sum: {
      quesoTaken: true,
      quesoRemaining: true,
      yogurtTaken: true,
      yogurtRemaining: true,
    },
  });

  const totalTaken = (product === "QUESO" ? workRecords._sum.quesoTaken : workRecords._sum.yogurtTaken) ?? 0;
  const totalRemaining =
    (product === "QUESO" ? workRecords._sum.quesoRemaining : workRecords._sum.yogurtRemaining) ?? 0;

  return totalPurchased - (totalTaken - totalRemaining);
}

// The purchase cost used for profit calculations is the most recent StockPurchase
// entry's unitCost — not a fixed constant — since the admin can record a new
// purchase at a different cost at any time and profit math should follow it.
export async function getLatestUnitCost(product: Product): Promise<number> {
  const latest = await prisma.stockPurchase.findFirst({
    where: { product },
    orderBy: { createdAt: "desc" },
    select: { unitCost: true },
  });

  return latest?.unitCost ?? 0;
}

// Each driver's Milk purchase cost (quantity*unitCost) per local calendar day,
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
    const key = milkCostKey(purchase.forUserId, formatDateKey(purchase.createdAt));
    result[key] = (result[key] ?? 0) + purchase.quantity * purchase.unitCost;
  }
  return result;
}

// Total grain purchase cost (quantity*unitCost across all three grain items),
// grouped by the local calendar day the purchase was made — used to split a day's
// grains cost evenly across however many drivers have a work record that day.
export async function getGrainsCostByDay(): Promise<Record<string, number>> {
  const purchases = await prisma.stockPurchase.findMany({
    where: { product: { in: GRAIN_PRODUCTS } },
    select: { quantity: true, unitCost: true, createdAt: true },
  });

  const result: Record<string, number> = {};
  for (const purchase of purchases) {
    const key = formatDateKey(purchase.createdAt);
    result[key] = (result[key] ?? 0) + purchase.quantity * purchase.unitCost;
  }
  return result;
}
