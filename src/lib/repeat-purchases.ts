import type { Product } from "@prisma/client";
import { formatBusinessDateKey } from "@/lib/dates";

export type RepeatKind = "MILK" | "GRAINS";

export const REPEAT_PRODUCTS: Record<RepeatKind, Product[]> = {
  MILK: ["MILK"],
  GRAINS: ["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"],
};

export interface RepeatablePurchase {
  product: Product;
  quantity: number;
  unitCost: number;
  createdAt: Date;
  forUserId: string | null;
}

export type RepeatError = "nothingToCopy" | "alreadyToday";

export type RepeatPlan =
  | { ok: true; day: string; purchases: RepeatablePurchase[] }
  | { ok: false; reason: RepeatError };

// Picks the purchases to copy into today: every purchase on the most recent
// (Bolivia) purchase day. Refuses when that day is already today, so pressing the
// button twice never duplicates a day. With `activeUserIds` (Milk), entries for a
// user who is no longer active — or with no user — are skipped.
export function planRepeatLastDay(
  purchases: RepeatablePurchase[],
  today: string,
  activeUserIds?: Set<string>,
): RepeatPlan {
  if (purchases.length === 0) return { ok: false, reason: "nothingToCopy" };

  const lastDay = purchases
    .map((p) => formatBusinessDateKey(p.createdAt))
    .reduce((latest, day) => (day > latest ? day : latest));
  if (lastDay >= today) return { ok: false, reason: "alreadyToday" };

  const toCopy = purchases.filter(
    (p) =>
      formatBusinessDateKey(p.createdAt) === lastDay &&
      (!activeUserIds || (p.forUserId !== null && activeUserIds.has(p.forUserId))),
  );
  if (toCopy.length === 0) return { ok: false, reason: "nothingToCopy" };

  return { ok: true, day: lastDay, purchases: toCopy };
}
