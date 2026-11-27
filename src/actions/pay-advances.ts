"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorState, requireAdminAccess } from "@/lib/auth/access";
import { formatBusinessDateKey } from "@/lib/dates";
import { DATE_KEY, firstIssue, objectIdSchema } from "@/lib/validation";
import type { ActionState } from "@/types/actions";

const advanceIdSchema = objectIdSchema("Advance not found.");

const advanceFields = z.object({
  date: DATE_KEY.refine((date) => date <= formatBusinessDateKey(new Date()), "Date can't be in the future."),
  amount: z.coerce.number().int("Amount must be a whole number.").min(1, "Amount must be at least 1."),
  description: z.string().trim().max(200, "Description is too long."),
});

const createSchema = advanceFields.extend({ userId: objectIdSchema("User not found.") });
const updateSchema = advanceFields.extend({ advanceId: advanceIdSchema });

function readFields(formData: FormData) {
  return {
    date: formData.get("date") ?? "",
    amount: formData.get("amount"),
    description: formData.get("description") ?? "",
  };
}

// The advances live in the panel header, shown on every panel page.
function refreshPanel() {
  revalidatePath("/", "layout");
}

function parseDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

// Admin only: records an advance given to a worker (seller or admin) of the company.
export async function createPayAdvance(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const access = await requireAdminAccess();

    const parsed = createSchema.safeParse({ userId: formData.get("userId") ?? "", ...readFields(formData) });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const seller = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    // Any active worker of the company: sellers and admins (an admin also works and is
    // paid). The super admin belongs to no company, so the company check leaves them out.
    if (!seller || !seller.isActive || seller.companyId !== access.companyId) {
      return { success: false, error: "User not found." };
    }

    await prisma.payAdvance.create({
      data: {
        companyId: access.companyId,
        userId: seller.id,
        date: parseDate(parsed.data.date),
        amount: parsed.data.amount,
        description: parsed.data.description,
        createdById: access.userId,
      },
    });

    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function updatePayAdvance(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const access = await requireAdminAccess();

    const parsed = updateSchema.safeParse({ advanceId: formData.get("advanceId") ?? "", ...readFields(formData) });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const existing = await prisma.payAdvance.findUnique({ where: { id: parsed.data.advanceId } });
    if (!existing || existing.companyId !== access.companyId || existing.settledAt) {
      return { success: false, error: "Advance not found." };
    }

    await prisma.payAdvance.update({
      where: { id: existing.id },
      data: {
        date: parseDate(parsed.data.date),
        amount: parsed.data.amount,
        description: parsed.data.description,
      },
    });

    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function deletePayAdvance(advanceId: string): Promise<ActionState> {
  try {
    const access = await requireAdminAccess();
    if (!advanceIdSchema.safeParse(advanceId).success) {
      return { success: false, error: "Advance not found." };
    }

    const existing = await prisma.payAdvance.findUnique({ where: { id: advanceId } });
    if (!existing || existing.companyId !== access.companyId || existing.settledAt) {
      return { success: false, error: "Advance not found." };
    }

    await prisma.payAdvance.delete({ where: { id: existing.id } });

    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

