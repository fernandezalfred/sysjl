import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";

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
