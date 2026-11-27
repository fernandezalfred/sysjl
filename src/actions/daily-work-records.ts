"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorState, requireAdminAccess, requireCompanyAccess, type Access } from "@/lib/auth/access";
import { formatBusinessDateKey } from "@/lib/dates";
import { getCurrentProductPrices } from "@/lib/money/product-prices";
import { repeatLastGrainDay } from "@/lib/repeat-grain-day";
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

// A new record's date is stamped client-side with today (not typed). An edit can move
// the record to another day, never a future one (Bolivia business day).
const createSchema = withLeftNotOverTaken(baseQuantities.extend({ date: DATE_KEY }));
const updateSchema = withLeftNotOverTaken(
  baseQuantities.extend({
    recordId: recordIdSchema,
    date: DATE_KEY.refine((date) => date <= formatBusinessDateKey(new Date()), "Date can't be in the future."),
  }),
);

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

    // The day's first sale brings in its grains: the last purchase day's grains are
    // copied into today (skipped when today already has grains).
    const grains = await repeatLastGrainDay(access.companyId, access.userId);
    if (grains.ok) revalidatePath("/admin/grains");

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
      date: formData.get("date") ?? "",
      ...readQuantities(formData),
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { id: parsed.data.recordId } });
    if (!existing || !canChangeRecord(access, existing)) {
      return { success: false, error: "Record not found." };
    }

    // One record per seller per day: moving it onto a day the seller already has is refused.
    const date = parseRecordDate(parsed.data.date);
    if (date.getTime() !== existing.date.getTime()) {
      const clash = await prisma.dailyWorkRecord.findUnique({
        where: { userId_date: { userId: existing.userId, date } },
      });
      if (clash) {
        return { success: false, error: "You already have a record for this date." };
      }
    }

    await prisma.dailyWorkRecord.update({
      where: { id: existing.id },
      data: {
        date,
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

const sellerIdSchema = objectIdSchema("User not found.");

// The "Por pagar" header is on every panel page, not only /dashboard.
function refreshPanel() {
  revalidatePath("/", "layout");
}

// Admin only: marks every unpaid day of one seller of the company as paid at once (the
// seller was paid everything they were owed). They all get the same payPaidAt, so
// undoLastPayment can put them back as unpaid together.
export async function payAllPendingForSeller(userId: string): Promise<ActionState> {
  try {
    const access = await requireAdminAccess();
    if (!sellerIdSchema.safeParse(userId).success) {
      return { success: false, error: "User not found." };
    }

    await prisma.dailyWorkRecord.updateMany({
      // Unpaid days usually have no payPaidAt at all (unset), not null.
      where: { companyId: access.companyId, userId, OR: [{ payPaidAt: null }, { payPaidAt: { isSet: false } }] },
      data: { payPaidAt: new Date() },
    });

    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

// Admin only: undoes the seller's most recent payment (a "Pagar todo" or a single day:
// every day with the latest payPaidAt), so those days show as owed again. Only for a
// seller who is up to date; while something is owed, there's nothing to restore.
export async function undoLastPayment(userId: string): Promise<ActionState> {
  try {
    const access = await requireAdminAccess();
    if (!sellerIdSchema.safeParse(userId).success) {
      return { success: false, error: "User not found." };
    }

    const owed = await prisma.dailyWorkRecord.count({
      where: { companyId: access.companyId, userId, OR: [{ payPaidAt: null }, { payPaidAt: { isSet: false } }] },
    });
    if (owed > 0) {
      return { success: false, error: "Pay what's owed first." };
    }

    const last = await prisma.dailyWorkRecord.findFirst({
      where: { companyId: access.companyId, userId, payPaidAt: { not: null } },
      orderBy: { payPaidAt: "desc" },
      select: { payPaidAt: true },
    });
    if (!last?.payPaidAt) {
      return { success: false, error: "Nothing to undo." };
    }

    await prisma.dailyWorkRecord.updateMany({
      where: { companyId: access.companyId, userId, payPaidAt: last.payPaidAt },
      data: { payPaidAt: null },
    });

    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}
