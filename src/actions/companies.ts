"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ACTIVE_COMPANY_COOKIE, authErrorState, requireSuperAdmin } from "@/lib/auth/access";
import { firstIssue, objectIdSchema } from "@/lib/validation";
import type { ActionState } from "@/types/actions";

const nameSchema = z.string().trim().min(1, "Company name is required.").max(100, "Name is too long.");
const companyIdSchema = objectIdSchema("Company not found.");

// The switcher's choice: readable by the server only, sent over HTTPS only in production.
const COMPANY_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  const existing = await prisma.company.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  return Boolean(existing);
}

function refreshPanel() {
  // Every panel page shows the active company's data.
  revalidatePath("/", "layout");
}

// Super admin: a new company, opened right away in the switcher.
export async function createCompany(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireSuperAdmin();
    const parsed = nameSchema.safeParse(formData.get("name") ?? "");
    if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
    if (await nameTaken(parsed.data)) return { success: false, error: "A company with this name already exists." };

    const company = await prisma.company.create({ data: { name: parsed.data } });
    (await cookies()).set(ACTIVE_COMPANY_COOKIE, company.id, COMPANY_COOKIE_OPTIONS);
    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function renameCompany(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireSuperAdmin();
    const id = companyIdSchema.safeParse(formData.get("companyId") ?? "");
    const name = nameSchema.safeParse(formData.get("name") ?? "");
    if (!id.success) return { success: false, error: "Company not found." };
    if (!name.success) return { success: false, error: firstIssue(name.error) };
    if (!(await prisma.company.findUnique({ where: { id: id.data }, select: { id: true } }))) {
      return { success: false, error: "Company not found." };
    }
    if (await nameTaken(name.data, id.data)) return { success: false, error: "A company with this name already exists." };

    await prisma.company.update({ where: { id: id.data }, data: { name: name.data } });
    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

// A deactivated company's users can't sign in (open sessions end on their next
// request); its data stays, and the super admin can still open it.
export async function setCompanyActive(companyId: string, isActive: boolean): Promise<ActionState> {
  try {
    await requireSuperAdmin();
    const id = companyIdSchema.safeParse(companyId);
    if (typeof isActive !== "boolean") return { success: false, error: "Invalid input." };
    if (!id.success || !(await prisma.company.findUnique({ where: { id: id.data }, select: { id: true } }))) {
      return { success: false, error: "Company not found." };
    }
    await prisma.company.update({ where: { id: id.data }, data: { isActive } });
    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

// The company switcher: which company the super admin's panel shows and changes.
export async function setActiveCompany(companyId: string): Promise<ActionState> {
  try {
    await requireSuperAdmin();
    const id = companyIdSchema.safeParse(companyId);
    if (!id.success || !(await prisma.company.findUnique({ where: { id: id.data }, select: { id: true } }))) {
      return { success: false, error: "Company not found." };
    }
    (await cookies()).set(ACTIVE_COMPANY_COOKIE, id.data, COMPANY_COOKIE_OPTIONS);
    refreshPanel();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}
