"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/require-session";
import { NotAuthorizedError, requireAdminSession } from "@/lib/auth/require-admin";
import { getCurrentProductPrices } from "@/lib/money/product-prices";

export interface RecordActionState {
  success: boolean;
  error?: string;
}

const baseQuantities = z.object({
  quesoTaken: z.coerce.number().int().min(0, "Cheese taken must be 0 or more."),
  quesoRemaining: z.coerce.number().int().min(0, "Cheese left must be 0 or more."),
  yogurtTaken: z.coerce.number().int().min(0, "Yogurt taken must be 0 or more."),
  yogurtRemaining: z.coerce.number().int().min(0, "Yogurt left must be 0 or more."),
  totalSold: z.coerce.number().int().min(0, "Total sold must be 0 or more."),
  // Milk taken that day and the price per liter it was bought at; liters × price is
  // deducted from Net profit. Required (0 allowed).
  milkLiters: z.coerce.number().int().min(0, "Milk liters must be 0 or more."),
  milkUnitCost: z.coerce.number().min(0, "Milk price per liter must be 0 or more."),
});

// The quantity fields every create/update form sends.
function readQuantities(formData: FormData) {
  return {
    quesoTaken: formData.get("quesoTaken"),
    quesoRemaining: formData.get("quesoRemaining"),
    yogurtTaken: formData.get("yogurtTaken"),
    yogurtRemaining: formData.get("yogurtRemaining"),
    totalSold: formData.get("totalSold"),
    milkLiters: formData.get("milkLiters"),
    milkUnitCost: formData.get("milkUnitCost"),
  };
}

// Date is only ever accepted on create (stamped client-side via the JS Date API, not
// typed by the user). Edits never carry a date, so the record's original date is
// never touched by updateDailyWorkRecord.
const createSchema = baseQuantities
  .extend({ date: z.string().min(1, "Date is required.") })
  .refine((v) => v.quesoRemaining <= v.quesoTaken, {
    message: "Cheese left cannot exceed Cheese taken.",
    path: ["quesoRemaining"],
  })
  .refine((v) => v.yogurtRemaining <= v.yogurtTaken, {
    message: "Yogurt left cannot exceed Yogurt taken.",
    path: ["yogurtRemaining"],
  });

function parseRecordDate(raw: string): Date {
  return new Date(`${raw}T00:00:00.000Z`);
}

type TargetUserResult = { userId: string } | { error: string };

async function resolveTargetUserId(
  session: Awaited<ReturnType<typeof requireUserSession>>,
  formData: FormData,
): Promise<TargetUserResult> {
  if (session.user.role !== "ADMIN") {
    return { userId: session.user.id };
  }

  const raw = formData.get("userId");
  if (typeof raw !== "string" || raw.length === 0) {
    return { error: "Select a user." };
  }

  const target = await prisma.user.findUnique({ where: { id: raw } });
  if (!target || !target.isActive) {
    return { error: "User not found." };
  }

  return { userId: target.id };
}

export async function createDailyWorkRecord(
  _prevState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  try {
    const session = await requireUserSession();

    const parsed = createSchema.safeParse({
      date: formData.get("date"),
      ...readQuantities(formData),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const targetUser = await resolveTargetUserId(session, formData);
    if ("error" in targetUser) {
      return { success: false, error: targetUser.error };
    }

    const userId = targetUser.userId;
    const date = parseRecordDate(parsed.data.date);

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { userId_date: { userId, date } } });
    if (existing) {
      return { success: false, error: "You already have a record for this date." };
    }

    // Sale price and purchase cost are snapshotted here, once, from whatever the
    // admin has them set to right now — a later change never rewrites this record's
    // revenue or Neto.
    const prices = await getCurrentProductPrices();

    await prisma.dailyWorkRecord.create({
      data: {
        userId,
        date,
        quesoTaken: parsed.data.quesoTaken,
        quesoRemaining: parsed.data.quesoRemaining,
        yogurtTaken: parsed.data.yogurtTaken,
        yogurtRemaining: parsed.data.yogurtRemaining,
        totalSold: parsed.data.totalSold,
        milkLiters: parsed.data.milkLiters,
        milkUnitCost: parsed.data.milkUnitCost,
        quesoSalePrice: prices.QUESO.salePrice,
        yogurtSalePrice: prices.YOGURT.salePrice,
        quesoPurchaseCost: prices.QUESO.purchaseCost,
        yogurtPurchaseCost: prices.YOGURT.purchaseCost,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

const updateSchema = baseQuantities
  .extend({ recordId: z.string().min(1) })
  .refine((v) => v.quesoRemaining <= v.quesoTaken, {
    message: "Cheese left cannot exceed Cheese taken.",
    path: ["quesoRemaining"],
  })
  .refine((v) => v.yogurtRemaining <= v.yogurtTaken, {
    message: "Yogurt left cannot exceed Yogurt taken.",
    path: ["yogurtRemaining"],
  });

export async function updateDailyWorkRecord(
  _prevState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  try {
    const session = await requireUserSession();

    const parsed = updateSchema.safeParse({
      recordId: formData.get("recordId"),
      ...readQuantities(formData),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { id: parsed.data.recordId } });
    const isOwner = existing?.userId === session.user.id;
    if (!existing || (!isOwner && session.user.role !== "ADMIN")) {
      return { success: false, error: "Record not found." };
    }

    // The record's date is never editable: an edit always keeps the original date.
    await prisma.dailyWorkRecord.update({
      where: { id: existing.id },
      data: {
        quesoTaken: parsed.data.quesoTaken,
        quesoRemaining: parsed.data.quesoRemaining,
        yogurtTaken: parsed.data.yogurtTaken,
        yogurtRemaining: parsed.data.yogurtRemaining,
        totalSold: parsed.data.totalSold,
        milkLiters: parsed.data.milkLiters,
        milkUnitCost: parsed.data.milkUnitCost,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function deleteDailyWorkRecord(recordId: string): Promise<RecordActionState> {
  try {
    const session = await requireUserSession();

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { id: recordId } });
    const isOwner = existing?.userId === session.user.id;
    if (!existing || (!isOwner && session.user.role !== "ADMIN")) {
      return { success: false, error: "Record not found." };
    }

    await prisma.dailyWorkRecord.delete({ where: { id: existing.id } });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

const payPaidSchema = z.object({ recordId: z.string().min(1), paid: z.boolean() });

// Admin only: marks a day's seller pay as paid (or undoes it). Display only — no
// amount changes, the Pago is just shown struck through and leaves the pending total.
export async function setRecordPayPaid(recordId: string, paid: boolean): Promise<RecordActionState> {
  try {
    await requireAdminSession();

    const parsed = payPaidSchema.safeParse({ recordId, paid });
    if (!parsed.success) {
      return { success: false, error: "Invalid input." };
    }

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { id: parsed.data.recordId } });
    if (!existing) {
      return { success: false, error: "Record not found." };
    }

    await prisma.dailyWorkRecord.update({
      where: { id: existing.id },
      data: { payPaidAt: parsed.data.paid ? new Date() : null },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
