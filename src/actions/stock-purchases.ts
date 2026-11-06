"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, NotAuthorizedError } from "@/lib/require-admin";
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
