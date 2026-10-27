"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/require-session";
import { NotAuthorizedError } from "@/lib/require-admin";

export interface RecordActionState {
  success: boolean;
  error?: string;
}

const quantitiesSchema = z
  .object({
    date: z.string().min(1, "Date is required."),
    quesoTaken: z.coerce.number().int().min(0, "Queso taken must be 0 or more."),
    quesoRemaining: z.coerce.number().int().min(0, "Queso remaining must be 0 or more."),
    yogurtTaken: z.coerce.number().int().min(0, "Yogurt taken must be 0 or more."),
    yogurtRemaining: z.coerce.number().int().min(0, "Yogurt remaining must be 0 or more."),
  })
  .refine((v) => v.quesoRemaining <= v.quesoTaken, {
    message: "Queso remaining cannot exceed Queso taken.",
    path: ["quesoRemaining"],
  })
  .refine((v) => v.yogurtRemaining <= v.yogurtTaken, {
    message: "Yogurt remaining cannot exceed Yogurt taken.",
    path: ["yogurtRemaining"],
  });

function parseRecordDate(raw: string): Date {
  return new Date(`${raw}T00:00:00.000Z`);
}

export async function createDailyWorkRecord(
  _prevState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  try {
    const session = await requireUserSession();

    const parsed = quantitiesSchema.safeParse({
      date: formData.get("date"),
      quesoTaken: formData.get("quesoTaken"),
      quesoRemaining: formData.get("quesoRemaining"),
      yogurtTaken: formData.get("yogurtTaken"),
      yogurtRemaining: formData.get("yogurtRemaining"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const userId = session.user.id;
    const date = parseRecordDate(parsed.data.date);

    const existing = await prisma.dailyWorkRecord.findUnique({ where: { userId_date: { userId, date } } });
    if (existing) {
      return { success: false, error: "You already have a record for this date." };
    }

    await prisma.dailyWorkRecord.create({
      data: {
        userId,
        date,
        quesoTaken: parsed.data.quesoTaken,
        quesoRemaining: parsed.data.quesoRemaining,
        yogurtTaken: parsed.data.yogurtTaken,
        yogurtRemaining: parsed.data.yogurtRemaining,
      },
    });

    revalidatePath("/records");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

const updateSchema = quantitiesSchema.and(z.object({ recordId: z.string().min(1) }));

export async function updateDailyWorkRecord(
  _prevState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  try {
    const session = await requireUserSession();

    const parsed = updateSchema.safeParse({
      recordId: formData.get("recordId"),
      date: formData.get("date"),
      quesoTaken: formData.get("quesoTaken"),
      quesoRemaining: formData.get("quesoRemaining"),
      yogurtTaken: formData.get("yogurtTaken"),
      yogurtRemaining: formData.get("yogurtRemaining"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const userId = session.user.id;
    const existing = await prisma.dailyWorkRecord.findUnique({ where: { id: parsed.data.recordId } });
    if (!existing || existing.userId !== userId) {
      return { success: false, error: "Record not found." };
    }

    const date = parseRecordDate(parsed.data.date);
    const dateChanged = date.getTime() !== existing.date.getTime();
    if (dateChanged) {
      const conflict = await prisma.dailyWorkRecord.findUnique({ where: { userId_date: { userId, date } } });
      if (conflict) {
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
      },
    });

    revalidatePath("/records");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
