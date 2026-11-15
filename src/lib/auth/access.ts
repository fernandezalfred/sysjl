import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminPermission } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isAdminRole, type AccessClaims } from "@/lib/auth/permissions";

export class NotAuthorizedError extends Error {}

// The company the super admin is working in (set by the company switcher). Anyone
// else always works in their own company, whatever this cookie says.
export const ACTIVE_COMPANY_COOKIE = "sysjl-company";

const OBJECT_ID = /^[0-9a-f]{24}$/i;

// A signed-in user bound to the company they act in: their own, or for the super
// admin the one picked in the switcher.
export interface Access extends AccessClaims {
  userId: string;
  userName: string | null;
  companyId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// The super admin's company: the switcher's choice if it still exists, else the
// oldest company. null when there's no company yet.
async function superAdminCompanyId(): Promise<string | null> {
  const chosen = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
  if (chosen && OBJECT_ID.test(chosen)) {
    const company = await prisma.company.findUnique({ where: { id: chosen }, select: { id: true } });
    if (company) return company.id;
  }
  const first = await prisma.company.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  return first?.id ?? null;
}

// The session's role and company (never a company id sent by the browser, except the
// super admin's own switcher choice). null when signed out, or the super admin before
// any company exists.
export async function getAccess(): Promise<Access | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { id, name, role, permissions } = session.user;
  const companyId = role === "SUPER_ADMIN" ? await superAdminCompanyId() : session.user.companyId;
  if (!companyId) return null;
  return {
    userId: id,
    userName: name ?? null,
    role,
    companyId,
    permissions,
    isAdmin: isAdminRole(role),
    isSuperAdmin: role === "SUPER_ADMIN",
  };
}

// Server Actions: any signed-in user of a company.
export async function requireCompanyAccess(): Promise<Access> {
  const access = await getAccess();
  if (!access) {
    const session = await auth();
    throw new NotAuthorizedError(session?.user?.role === "SUPER_ADMIN" ? "Create a company first." : "Sign-in required.");
  }
  return access;
}

// Server Actions: a company admin (or the super admin), with `permission` when given.
export async function requireAdminAccess(permission?: AdminPermission): Promise<Access> {
  const access = await getAccess();
  if (!access?.isAdmin || (permission && !hasPermission(access, permission))) {
    throw new NotAuthorizedError("Admin access required.");
  }
  return access;
}

// Server Actions on companies themselves: the super admin only.
export async function requireSuperAdmin(): Promise<{ userId: string }> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new NotAuthorizedError("Super admin access required.");
  }
  return { userId: session.user.id };
}

// Pages: the access to render with, or a redirect — sign in, the companies page
// (super admin without a company), or the dashboard (missing permission).
export async function requirePageAccess(permission?: AdminPermission): Promise<Access> {
  const access = await getAccess();
  if (!access) {
    const session = await auth();
    redirect(session?.user?.role === "SUPER_ADMIN" ? "/admin/companies" : "/login");
  }
  if (permission && !hasPermission(access, permission)) redirect("/dashboard");
  return access;
}
