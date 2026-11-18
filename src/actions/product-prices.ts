"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PricedProduct } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authErrorState, requireAdminAccess } from "@/lib/auth/access";
import { firstIssue } from "@/lib/validation";
import type { ActionState } from "@/types/actions";

const setPriceSchema = z.object({
  product: z.enum(PricedProduct),
  salePrice: z.coerce.number().min(0, "Sale price must be 0 or more."),
  purchaseCost: z.coerce.number().min(0, "Purchase cost must be 0 or more."),
});

// Updates the product's single price row (sale price + purchase cost) in place — no
// history is kept, just who last set it and when.
export async function setProductPrice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const access = await requireAdminAccess("PRICES");

    const parsed = setPriceSchema.safeParse({
      product: formData.get("product"),
      salePrice: formData.get("salePrice"),
      purchaseCost: formData.get("purchaseCost") ?? undefined,
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    await prisma.productPrice.upsert({
      where: { companyId_product: { companyId: access.companyId, product: parsed.data.product } },
      update: {
        salePrice: parsed.data.salePrice,
        purchaseCost: parsed.data.purchaseCost,
        setById: access.userId,
      },
      create: {
        companyId: access.companyId,
        product: parsed.data.product,
        salePrice: parsed.data.salePrice,
        purchaseCost: parsed.data.purchaseCost,
        setById: access.userId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}
