"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, NotAuthorizedError } from "@/lib/require-admin";

export interface ActionState {
  success: boolean;
  error?: string;
}

const setPriceSchema = z.object({
  product: z.enum(["QUESO", "YOGURT"]),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be 0 or more."),
  salePrice: z.coerce.number().min(0, "Sale price must be 0 or more."),
});

// Always inserts a new row rather than updating one in place, so the full price
// history — including who changed it and when — is preserved per project-overview.md §4.
export async function setProductPrice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const session = await requireAdminSession();

    const parsed = setPriceSchema.safeParse({
      product: formData.get("product"),
      purchasePrice: formData.get("purchasePrice"),
      salePrice: formData.get("salePrice"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    await prisma.productPrice.create({
      data: {
        product: parsed.data.product,
        purchasePrice: parsed.data.purchasePrice,
        salePrice: parsed.data.salePrice,
        setById: session.user.id,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
