import { prisma } from "@/lib/prisma";
import { formatBusinessDateKey } from "@/lib/dates";
import { GRAIN_PRODUCTS, planRepeatLastDay, type RepeatPlan } from "@/lib/repeat-purchases";

// No purchase day spans more than 24h, so this window before the latest purchase
// always covers that whole day.
const LAST_DAY_WINDOW_MS = 36 * 60 * 60 * 1000;

// Copies every grain purchase of the company's most recent purchase day into today
// (same item, quantity and unit cost). Does nothing when there's nothing to copy or
// today already has grain purchases, so it never duplicates a day.
export async function repeatLastGrainDay(companyId: string, createdById: string): Promise<RepeatPlan> {
  const latest = await prisma.stockPurchase.findFirst({
    where: { companyId, product: { in: GRAIN_PRODUCTS } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!latest) return { ok: false, reason: "nothingToCopy" };

  const recent = await prisma.stockPurchase.findMany({
    where: {
      companyId,
      product: { in: GRAIN_PRODUCTS },
      createdAt: { gte: new Date(latest.createdAt.getTime() - LAST_DAY_WINDOW_MS) },
    },
    orderBy: { createdAt: "asc" },
    select: { product: true, quantity: true, unitCost: true, createdAt: true },
  });

  const plan = planRepeatLastDay(recent, formatBusinessDateKey(new Date()));
  if (!plan.ok) return plan;

  await prisma.stockPurchase.createMany({
    data: plan.purchases.map((p) => ({
      product: p.product,
      quantity: p.quantity,
      unitCost: p.unitCost,
      companyId,
      createdById,
    })),
  });
  return plan;
}
