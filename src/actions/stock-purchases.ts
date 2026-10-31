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
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
