import type { AdminPermission, Role } from "@prisma/client";

// Pure and Prisma-free (type imports only), so Client Components can use it.

export const ADMIN_PERMISSIONS: AdminPermission[] = ["FINANCE", "USERS", "GRAINS", "PRICES"];

// What a signed-in user can reach, carried in the JWT and refreshed from the database
// on every session check (src/auth.ts).
export interface AccessClaims {
  role: Role;
  // null only for the super admin, who picks a company to work in.
  companyId: string | null;
  permissions: AdminPermission[];
}

export interface StoredUserAccess {
  role: Role;
  companyId: string | null;
  permissions: AdminPermission[];
  isActive: boolean;
  company: { isActive: boolean } | null;
}

// The claims a stored user signs in with, or null when they can't sign in: a
// deactivated user, or anyone but the super admin without an active company.
export function toAccessClaims(user: StoredUserAccess): AccessClaims | null {
  if (!user.isActive) return null;
  if (user.role === "SUPER_ADMIN") return { role: "SUPER_ADMIN", companyId: null, permissions: ADMIN_PERMISSIONS };
  if (!user.companyId || !user.company?.isActive) return null;
  return {
    role: user.role,
    companyId: user.companyId,
    permissions: user.role === "ADMIN" ? ADMIN_PERMISSIONS.filter((p) => user.permissions.includes(p)) : [],
  };
}

// Admins of a company and the super admin see a company's costs, Neto and every seller.
export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

// The super admin has every permission; a company admin only the granted ones.
export function hasPermission(claims: Pick<AccessClaims, "role" | "permissions">, permission: AdminPermission): boolean {
  if (claims.role === "SUPER_ADMIN") return true;
  return claims.role === "ADMIN" && claims.permissions.includes(permission);
}
