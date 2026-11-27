"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorState, NotAuthorizedError, requireAdminAccess } from "@/lib/auth/access";
import { formatBusinessDateKey, moveToBusinessDay } from "@/lib/dates";
import { GRAIN_PRODUCTS, type RepeatError } from "@/lib/repeat-purchases";
import { repeatLastGrainDay } from "@/lib/repeat-grain-day";
import type { Product } from "@prisma/client";
import { firstIssue, objectIdSchema } from "@/lib/validation";
import type { ActionState } from "@/types/actions";

// Purchase costs feed Neto on /dashboard. Grains also have their own page; Queso and
// Yogurt don't any more (their cost is set next to the sale price on /dashboard).
function refreshAfterPurchaseChange(product: Product) {
  if (GRAIN_PRODUCTS.includes(product)) revalidatePath("/admin/grains");
  revalidatePath("/dashboard");
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
    const access = await requireAdminAccess("GRAINS");

    const parsed = createSchema.safeParse({
      product: formData.get("product"),
      quantity: formData.get("quantity"),
      unitCost: formData.get("unitCost"),
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    await prisma.stockPurchase.create({
      data: {
        product: parsed.data.product,
        quantity: parsed.data.quantity,
        unitCost: parsed.data.unitCost,
        companyId: access.companyId,
        createdById: access.userId,
      },
    });

    refreshAfterPurchaseChange(parsed.data.product);
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

const purchaseIdSchema = objectIdSchema("Stock purchase not found.");

// The purchase's Bolivia day (YYYY-MM-DD); only editing can change it, creating is
// always today. Never a future day.
const updateSchema = quantityAndCost.extend({
  purchaseId: purchaseIdSchema,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required.")
    .refine((date) => date <= formatBusinessDateKey(new Date()), "Date can't be in the future."),
});

export async function updateStockPurchase(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const access = await requireAdminAccess("GRAINS");

    const parsed = updateSchema.safeParse({
      purchaseId: formData.get("purchaseId"),
      quantity: formData.get("quantity"),
      unitCost: formData.get("unitCost"),
      date: formData.get("date") ?? "",
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const existing = await prisma.stockPurchase.findUnique({ where: { id: parsed.data.purchaseId } });
    if (!existing || existing.companyId !== access.companyId) {
      return { success: false, error: "Stock purchase not found." };
    }

    await prisma.stockPurchase.update({
      where: { id: existing.id },
      data: {
        quantity: parsed.data.quantity,
        unitCost: parsed.data.unitCost,
        createdAt: moveToBusinessDay(existing.createdAt, parsed.data.date),
      },
    });

    refreshAfterPurchaseChange(existing.product);
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function deleteStockPurchase(purchaseId: string): Promise<ActionState> {
  try {
    const access = await requireAdminAccess("GRAINS");
    if (!purchaseIdSchema.safeParse(purchaseId).success) {
      return { success: false, error: "Stock purchase not found." };
    }

    const existing = await prisma.stockPurchase.findUnique({ where: { id: purchaseId } });
    if (!existing || existing.companyId !== access.companyId) {
      return { success: false, error: "Stock purchase not found." };
    }

    await prisma.stockPurchase.delete({ where: { id: existing.id } });

    refreshAfterPurchaseChange(existing.product);
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export interface RepeatActionState {
  success: boolean;
  error?: RepeatError | "notAuthorized";
  count?: number;
}

// Copies every grain purchase from the most recent purchase day into today (same
// item, quantity and unit cost), so the admin doesn't re-enter an unchanged day by
// hand. Refuses if today already has purchases.
export async function repeatLastDayPurchases(): Promise<RepeatActionState> {
  try {
    const access = await requireAdminAccess("GRAINS");

    const plan = await repeatLastGrainDay(access.companyId, access.userId);
    if (!plan.ok) return { success: false, error: plan.reason };

    revalidatePath("/admin/grains");
    revalidatePath("/dashboard");
    return { success: true, count: plan.purchases.length };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: "notAuthorized" };
    }
    throw error;
  }
}
