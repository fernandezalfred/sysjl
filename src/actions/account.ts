"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { authErrorState } from "@/lib/auth/access";
import { requireUserSession } from "@/lib/auth/require-session";
import { firstIssue, NEW_PASSWORD } from "@/lib/validation";
import type { ActionState } from "@/types/actions";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: NEW_PASSWORD,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The new passwords don't match.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "The new password must be different from the current one.",
  });

export async function changeOwnPassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const session = await requireUserSession();

    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword") ?? "",
      newPassword: formData.get("newPassword") ?? "",
      confirmPassword: formData.get("confirmPassword") ?? "",
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.isActive) {
      return { success: false, error: "User not found." };
    }

    const isValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}
