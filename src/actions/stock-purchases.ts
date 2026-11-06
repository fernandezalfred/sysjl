"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, NotAuthorizedError } from "@/lib/require-admin";
import { formatBusinessDateKey } from "@/lib/dates";
import { planRepeatLastDay, REPEAT_PRODUCTS, type RepeatError, type RepeatKind } from "@/lib/repeat-purchases";
import type { Product } from "@prisma/client";

export interface ActionState {
  success: boolean;
  error?: string;
}

function panelPathForProduct(product: Product): string {
  switch (product) {
    case "QUESO":
      return "/admin/cheese";
    case "YOGURT":
      return "/admin/yogurt";
    case "MILK":
      return "/admin/milk";
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
  product: z.enum(["QUESO", "YOGURT", "MILK", "MAIZ_PELADO", "MAIZ_CASCARA", "HABA"]),
  // Only read for MILK: the driver this purchase is for, picked from a dropdown on
  // that page. Distinct from createdById, which stays the entering admin for every
  // product, Milk included — this never replaces it.
  forUserId: z.string().optional(),
});

// The user a Milk purchase is for must be an active account (any role) — never a
// deactivated or nonexistent one.
async function resolveMilkForUserId(forUserId: string | undefined): Promise<{ id: string } | { error: string }> {
  if (!forUserId) {
    return { error: "Select a user." };
  }

  const target = await prisma.user.findUnique({ where: { id: forUserId } });
  if (!target || !target.isActive) {
    return { error: "User not found." };
  }
  return { id: target.id };
}

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
      forUserId: formData.get("forUserId") ?? undefined,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    let forUserId: string | undefined;
    if (parsed.data.product === "MILK") {
      const resolved = await resolveMilkForUserId(parsed.data.forUserId);
      if ("error" in resolved) {
        return { success: false, error: resolved.error };
      }
      forUserId = resolved.id;
    }

    await prisma.stockPurchase.create({
      data: {
        product: parsed.data.product,
        quantity: parsed.data.quantity,
        unitCost: parsed.data.unitCost,
        createdById: session.user.id,
        forUserId,
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

const updateSchema = quantityAndCost.extend({ purchaseId: z.string().min(1) });

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
      data: { quantity: parsed.data.quantity, unitCost: parsed.data.unitCost },
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

const repeatKindSchema = z.enum(["MILK", "GRAINS"]);

// No purchase day spans more than 24h, so this window before the latest purchase
// always covers that whole day.
const LAST_DAY_WINDOW_MS = 36 * 60 * 60 * 1000;

// Copies every Milk or grain purchase from the most recent purchase day into today
// (same item, quantity, unit cost and — for Milk — user), so the admin doesn't
// re-enter an unchanged day by hand. Refuses if today already has purchases.
export async function repeatLastDayPurchases(kind: RepeatKind): Promise<RepeatActionState> {
  try {
    const session = await requireAdminSession();
    const parsedKind = repeatKindSchema.parse(kind);
    const products = REPEAT_PRODUCTS[parsedKind];

    const latest = await prisma.stockPurchase.findFirst({
      where: { product: { in: products } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!latest) return { success: false, error: "nothingToCopy" };

    const recent = await prisma.stockPurchase.findMany({
      where: {
        product: { in: products },
        createdAt: { gte: new Date(latest.createdAt.getTime() - LAST_DAY_WINDOW_MS) },
      },
      orderBy: { createdAt: "asc" },
      select: { product: true, quantity: true, unitCost: true, createdAt: true, forUserId: true },
    });

    let activeUserIds: Set<string> | undefined;
    if (parsedKind === "MILK") {
      const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
      activeUserIds = new Set(users.map((u) => u.id));
    }

    const plan = planRepeatLastDay(recent, formatBusinessDateKey(new Date()), activeUserIds);
    if (!plan.ok) return { success: false, error: plan.reason };

    await prisma.stockPurchase.createMany({
      data: plan.purchases.map((p) => ({
        product: p.product,
        quantity: p.quantity,
        unitCost: p.unitCost,
        createdById: session.user.id,
        forUserId: p.forUserId,
      })),
    });

    revalidatePath(parsedKind === "MILK" ? "/admin/milk" : "/admin/grains");
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
