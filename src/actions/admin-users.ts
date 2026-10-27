"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requireAdminSession, NotAuthorizedError } from "@/lib/require-admin";

export interface ActionState {
  success: boolean;
  error?: string;
}

const roleSchema = z.enum(["ADMIN", "VEHICLE_USER"]);

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: roleSchema,
});

export async function createUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const parsed = createUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return { success: false, error: "A user with this email already exists." };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  role: roleSchema,
  newPassword: z.union([z.string().min(8, "Password must be at least 8 characters."), z.literal("")]),
  vehicleId: z.string(),
});

export async function updateUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const parsed = updateUserSchema.safeParse({
      userId: formData.get("userId"),
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      newPassword: formData.get("newPassword") ?? "",
      vehicleId: formData.get("vehicleId") ?? "",
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { userId, name, email, role, newPassword, vehicleId } = parsed.data;

    const emailTaken = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (emailTaken) {
      return { success: false, error: "A user with this email already exists." };
    }

    const currentVehicle = await prisma.vehicle.findUnique({ where: { userId } });
    if (currentVehicle && currentVehicle.id !== vehicleId) {
      await prisma.vehicle.update({ where: { id: currentVehicle.id }, data: { userId: null } });
    }

    if (vehicleId) {
      const target = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!target) {
        return { success: false, error: "Vehicle not found." };
      }
      if (target.userId && target.userId !== userId) {
        return { success: false, error: "That vehicle is already assigned to another user." };
      }
      await prisma.vehicle.update({ where: { id: vehicleId }, data: { userId } });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  await requireAdminSession();
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/users");
}
