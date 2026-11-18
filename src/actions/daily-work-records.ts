"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorState, requireAdminAccess, requireCompanyAccess, type Access } from "@/lib/auth/access";
import { getCurrentProductPrices } from "@/lib/money/product-prices";
import { DATE_KEY, firstIssue, OBJECT_ID, objectIdSchema } from "@/lib/validation";
import type { ActionState } from "@/types/actions";

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

type Quantities = z.infer<typeof baseQuantities>;

// What was left of a product can't be more than what was taken.
function withLeftNotOverTaken<T extends z.ZodType<Quantities>>(schema: T): T {
  return schema
    .refine((v) => v.quesoRemaining <= v.quesoTaken, {
      message: "Cheese left cannot exceed Cheese taken.",
      path: ["quesoRemaining"],
    })
    .refine((v) => v.yogurtRemaining <= v.yogurtTaken, {
      message: "Yogurt left cannot exceed Yogurt taken.",
      path: ["yogurtRemaining"],
    });
}

const recordIdSchema = objectIdSchema("Record not found.");

// Date is only ever accepted on create (stamped client-side via the JS Date API, not
// typed by the user). Edits never carry a date, so the record's original date is
// never touched by updateDailyWorkRecord.
const createSchema = withLeftNotOverTaken(baseQuantities.extend({ date: DATE_KEY }));
const updateSchema = withLeftNotOverTaken(baseQuantities.extend({ recordId: recordIdSchema }));

// Sale records show on /dashboard (charts, table and the day's pay).
function refreshSaleRecords() {
  revalidatePath("/dashboard");
}

function parseRecordDate(raw: string): Date {
  return new Date(`${raw}T00:00:00.000Z`);
}

type TargetUserResult = { userId: string } | { error: string };

// A seller records their own day; an admin picks any active user of the same company.
async function resolveTargetUserId(access: Access, formData: FormData): Promise<TargetUserResult> {
  if (!access.isAdmin) {
    return { userId: access.userId };
  }

  const raw = formData.get("userId");
  if (typeof raw !== "string" || raw.length === 0) {
    return { error: "Select a user." };
  }
  if (!OBJECT_ID.test(raw)) {
    return { error: "User not found." };
  }

  const target = await prisma.user.findUnique({ where: { id: raw } });
  if (!target || !target.isActive || target.companyId !== access.companyId) {
    return { error: "User not found." };
  }

  return { userId: target.id };
}

// A record of the acting company, and the acting user's own unless they're an admin.
// Another company's record reads as not found.
function canChangeRecord(access: Access, record: { userId: string; companyId: string | null }): boolean {
  return record.companyId === access.companyId && (access.isAdmin || record.userId === access.userId);
}

export async function createDailyWorkRecord(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const access = await requireCompanyAccess();

    const parsed = createSchema.safeParse({
      date: formData.get("date"),
      ...readQuantities(formData),
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const targetUser = await resolveTargetUserId(access, formData);
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
    const prices = await getCurrentProductPrices(access.companyId);

    await prisma.dailyWorkRecord.create({
      data: {
        userId,
        companyId: access.companyId,
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

    refreshSaleRecords();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function updateDailyWorkRecord(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const access = await requireCompanyAccess();

    const parsed = updateSchema.safeParse({
      recordId: formData.get("recordId"),
      ...readQuantities(formData),
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { id: parsed.data.recordId } });
    if (!existing || !canChangeRecord(access, existing)) {
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

    refreshSaleRecords();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function deleteDailyWorkRecord(recordId: string): Promise<ActionState> {
  try {
    const access = await requireCompanyAccess();
    if (!recordIdSchema.safeParse(recordId).success) {
      return { success: false, error: "Record not found." };
    }

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { id: recordId } });
    if (!existing || !canChangeRecord(access, existing)) {
      return { success: false, error: "Record not found." };
    }

    await prisma.dailyWorkRecord.delete({ where: { id: existing.id } });

    refreshSaleRecords();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

// Admin only: marks a day's seller pay as paid (or undoes it). Display only — no
// amount changes, the Pago is just shown struck through and leaves the pending total.
export async function setRecordPayPaid(recordId: string, paid: boolean): Promise<ActionState> {
  try {
    const access = await requireAdminAccess();

    if (typeof paid !== "boolean") {
      return { success: false, error: "Invalid input." };
    }
    if (!recordIdSchema.safeParse(recordId).success) {
      return { success: false, error: "Record not found." };
    }

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { id: recordId } });
    if (!existing || existing.companyId !== access.companyId) {
      return { success: false, error: "Record not found." };
    }

    await prisma.dailyWorkRecord.update({
      where: { id: existing.id },
      data: { payPaidAt: paid ? new Date() : null },
    });

    refreshSaleRecords();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}
