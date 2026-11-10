"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, NotAuthorizedError } from "@/lib/auth/require-admin";
import { formatBusinessDateKey } from "@/lib/dates";
import { GRAIN_PRODUCTS, planRepeatLastDay, type RepeatError } from "@/lib/repeat-purchases";
import type { Product } from "@prisma/client";

export interface ActionState {
  success: boolean;
  error?: string;
}

// Queso and Yogurt no longer have a purchase page (their cost is set next to the
// sale price on /dashboard); their old purchases only refresh /dashboard.
function panelPathForProduct(product: Product): string {
  switch (product) {
    case "QUESO":
    case "YOGURT":
      return "/dashboard";
    case "MAIZ_PELADO":
    case "MAIZ_CASCARA":
    case "HABA":
      return "/admin/grains";
  }
}

const quantityAndCost = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  unitCost: z.coerce.number().min(0, "Unit cost must be 0 or more."),
});

const createSchema = quantityAndCost.extend({
  product: z.enum(["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"]),
});

export async function createStockPurchase(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const session = await requireAdminSession();

    const parsed = createSchema.safeParse({
      product: formData.get("product"),
      quantity: formData.get("quantity"),
      unitCost: formData.get("unitCost"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    await prisma.stockPurchase.create({
      data: {
        product: parsed.data.product,
        quantity: parsed.data.quantity,
        unitCost: parsed.data.unitCost,
        createdById: session.user.id,
      },
    });

    revalidatePath(panelPathForProduct(parsed.data.product));
    // Purchase costs feed Net profit on /dashboard (Sale Records) and / (Totals by User).
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

const updateSchema = quantityAndCost.extend({
  purchaseId: z.string().min(1),
});

export async function updateStockPurchase(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdminSession();

    const parsed = updateSchema.safeParse({
      purchaseId: formData.get("purchaseId"),
      quantity: formData.get("quantity"),
      unitCost: formData.get("unitCost"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const existing = await prisma.stockPurchase.findUnique({ where: { id: parsed.data.purchaseId } });
    if (!existing) {
      return { success: false, error: "Stock purchase not found." };
    }

    await prisma.stockPurchase.update({
      where: { id: existing.id },
      data: {
        quantity: parsed.data.quantity,
        unitCost: parsed.data.unitCost,
      },
    });

    revalidatePath(panelPathForProduct(existing.product));
    // Purchase costs feed Net profit on /dashboard (Sale Records) and / (Totals by User).
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function deleteStockPurchase(purchaseId: string): Promise<ActionState> {
  try {
    await requireAdminSession();

    const existing = await prisma.stockPurchase.findUnique({ where: { id: purchaseId } });
    if (!existing) {
      return { success: false, error: "Stock purchase not found." };
    }

    await prisma.stockPurchase.delete({ where: { id: existing.id } });

    revalidatePath(panelPathForProduct(existing.product));
    // Purchase costs feed Net profit on /dashboard (Sale Records) and / (Totals by User).
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export interface RepeatActionState {
  success: boolean;
  error?: RepeatError | "notAuthorized";
  count?: number;
}

// No purchase day spans more than 24h, so this window before the latest purchase
// always covers that whole day.
const LAST_DAY_WINDOW_MS = 36 * 60 * 60 * 1000;

// Copies every grain purchase from the most recent purchase day into today (same
// item, quantity and unit cost), so the admin doesn't re-enter an unchanged day by
// hand. Refuses if today already has purchases.
export async function repeatLastDayPurchases(): Promise<RepeatActionState> {
  try {
    const session = await requireAdminSession();

    const latest = await prisma.stockPurchase.findFirst({
      where: { product: { in: GRAIN_PRODUCTS } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!latest) return { success: false, error: "nothingToCopy" };

    const recent = await prisma.stockPurchase.findMany({
      where: {
        product: { in: GRAIN_PRODUCTS },
        createdAt: { gte: new Date(latest.createdAt.getTime() - LAST_DAY_WINDOW_MS) },
      },
      orderBy: { createdAt: "asc" },
      select: { product: true, quantity: true, unitCost: true, createdAt: true },
    });

    const plan = planRepeatLastDay(recent, formatBusinessDateKey(new Date()));
    if (!plan.ok) return { success: false, error: plan.reason };

    await prisma.stockPurchase.createMany({
      data: plan.purchases.map((p) => ({
        product: p.product,
        quantity: p.quantity,
        unitCost: p.unitCost,
        createdById: session.user.id,
      })),
    });

    revalidatePath("/admin/grains");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, count: plan.purchases.length };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: "notAuthorized" };
    }
    throw error;
  }
}
