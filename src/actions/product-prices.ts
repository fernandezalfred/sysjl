"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PricedProduct } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, NotAuthorizedError } from "@/lib/require-admin";

export interface ActionState {
  success: boolean;
  error?: string;
}

const setPriceSchema = z.object({
  product: z.enum(PricedProduct),
  salePrice: z.coerce.number().min(0, "Sale price must be 0 or more."),
});

// Updates the product's single price row in place — no history is kept, just who
// last set it and when.
export async function setProductPrice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const session = await requireAdminSession();

    const parsed = setPriceSchema.safeParse({
      product: formData.get("product"),
      salePrice: formData.get("salePrice"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    await prisma.productPrice.upsert({
      where: { product: parsed.data.product },
      update: {
        salePrice: parsed.data.salePrice,
        setById: session.user.id,
      },
      create: {
        product: parsed.data.product,
        salePrice: parsed.data.salePrice,
        setById: session.user.id,
      },
    });

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
