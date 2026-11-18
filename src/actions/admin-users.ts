"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AdminPermission, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { authErrorState, requireAdminAccess, type Access } from "@/lib/auth/access";
import { ADMIN_PERMISSIONS } from "@/lib/auth/permissions";
import { EMAIL, firstIssue, NEW_PASSWORD, OBJECT_ID, PERSON_NAME, objectIdSchema } from "@/lib/validation";
import type { ActionState } from "@/types/actions";

// SUPER_ADMIN is never assignable: there's exactly one, set up by
// prisma/migrate-to-companies.ts.
const roleSchema = z.enum(["ADMIN", "VEHICLE_USER"]);

const ONLY_SUPER_ADMIN = "Only the super admin can manage admins.";

const createUserSchema = z.object({
  name: PERSON_NAME,
  email: EMAIL,
  password: NEW_PASSWORD,
  role: roleSchema,
});

// The permissions ticked on the form, kept only for an admin and only when the super
// admin sends them; anyone else's are [].
function readPermissions(formData: FormData, role: Role, access: Access): AdminPermission[] {
  if (role !== "ADMIN" || !access.isSuperAdmin) return [];
  const ticked = formData.getAll("permissions");
  return ADMIN_PERMISSIONS.filter((p) => ticked.includes(p));
}

// A company admin manages the sellers of their company; admins (and their
// permissions) are the super admin's. Another company's user reads as not found.
async function findManageableUser(access: Access, userId: string) {
  if (!OBJECT_ID.test(userId)) return { error: "User not found." } as const;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.companyId !== access.companyId || target.role === "SUPER_ADMIN") {
    return { error: "User not found." } as const;
  }
  if (target.role === "ADMIN" && !access.isSuperAdmin) return { error: ONLY_SUPER_ADMIN } as const;
  return { target } as const;
}

export async function createUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const access = await requireAdminAccess("USERS");

    const parsed = createUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }
    if (parsed.data.role === "ADMIN" && !access.isSuperAdmin) {
      return { success: false, error: ONLY_SUPER_ADMIN };
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
        companyId: access.companyId,
        permissions: readPermissions(formData, parsed.data.role, access),
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

const updateUserSchema = z.object({
  userId: objectIdSchema("User not found."),
  name: PERSON_NAME,
  email: EMAIL,
  role: roleSchema,
  newPassword: z.union([NEW_PASSWORD, z.literal("")]),
});

export async function updateUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const access = await requireAdminAccess("USERS");

    const parsed = updateUserSchema.safeParse({
      userId: formData.get("userId"),
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      newPassword: formData.get("newPassword") ?? "",
    });
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const { userId, name, email, role, newPassword } = parsed.data;

    const found = await findManageableUser(access, userId);
    if ("error" in found) return { success: false, error: found.error };
    if (role === "ADMIN" && !access.isSuperAdmin) return { success: false, error: ONLY_SUPER_ADMIN };

    const emailTaken = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (emailTaken) {
      return { success: false, error: "A user with this email already exists." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        permissions: readPermissions(formData, role, access),
        ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function setUserActive(userId: string, isActive: boolean): Promise<ActionState> {
  try {
    const access = await requireAdminAccess("USERS");
    if (typeof userId !== "string" || typeof isActive !== "boolean") {
      return { success: false, error: "Invalid input." };
    }
    const found = await findManageableUser(access, userId);
    if ("error" in found) return { success: false, error: found.error };

    await prisma.user.update({ where: { id: userId }, data: { isActive } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}
