import type { Role } from "@prisma/client";

export interface MigrationUser {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export type MigrationPlan =
  | { ok: true; superAdminId: string; promote: boolean; adminIds: string[] }
  | { ok: false; reason: string };

// Who becomes the one super admin when existing data moves into the first company:
// an existing super admin (re-running changes nothing), else the admin with
// `superAdminEmail`, else the oldest admin. Every other admin becomes that company's
// admin with every permission.
export function planCompanyMigration(users: MigrationUser[], superAdminEmail?: string): MigrationPlan {
  const supers = users.filter((u) => u.role === "SUPER_ADMIN");
  if (supers.length > 1) return { ok: false, reason: "There is more than one super admin." };

  const admins = users.filter((u) => u.role === "ADMIN").sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let superAdmin = supers[0];
  if (!superAdmin && superAdminEmail) {
    superAdmin = admins.find((u) => u.email.toLowerCase() === superAdminEmail.toLowerCase())!;
    if (!superAdmin) return { ok: false, reason: `No admin with the email ${superAdminEmail}.` };
  }
  superAdmin ??= admins[0];
  if (!superAdmin) return { ok: false, reason: "There is no admin to make super admin." };

  return {
    ok: true,
    superAdminId: superAdmin.id,
    promote: superAdmin.role !== "SUPER_ADMIN",
    adminIds: admins.filter((u) => u.id !== superAdmin.id).map((u) => u.id),
  };
}
