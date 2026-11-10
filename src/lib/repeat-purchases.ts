import type { Product } from "@prisma/client";
import { formatBusinessDateKey } from "@/lib/dates";

export const GRAIN_PRODUCTS: Product[] = ["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"];

export interface RepeatablePurchase {
  product: Product;
  quantity: number;
  unitCost: number;
  createdAt: Date;
}

export type RepeatError = "nothingToCopy" | "alreadyToday";

export type RepeatPlan =
  | { ok: true; day: string; purchases: RepeatablePurchase[] }
  | { ok: false; reason: RepeatError };

// Picks the purchases to copy into today: every purchase on the most recent
// (Bolivia) purchase day. Refuses when that day is already today, so pressing the
// button twice never duplicates a day.
export function planRepeatLastDay(purchases: RepeatablePurchase[], today: string): RepeatPlan {
  if (purchases.length === 0) return { ok: false, reason: "nothingToCopy" };

  const lastDay = purchases
    .map((p) => formatBusinessDateKey(p.createdAt))
    .reduce((latest, day) => (day > latest ? day : latest));
  if (lastDay >= today) return { ok: false, reason: "alreadyToday" };

  const toCopy = purchases.filter((p) => formatBusinessDateKey(p.createdAt) === lastDay);
  return { ok: true, day: lastDay, purchases: toCopy };
}
