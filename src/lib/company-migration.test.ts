import { describe, expect, it } from "vitest";
import { planCompanyMigration, type MigrationUser } from "@/lib/company-migration";

const user = (id: string, role: MigrationUser["role"], day: number, email = `${id}@jl.bo`): MigrationUser => ({
  id,
  email,
  role,
  createdAt: new Date(`2026-10-0${day}T12:00:00Z`),
});

describe("planCompanyMigration", () => {
  const users = [user("seller", "VEHICLE_USER", 1), user("second", "ADMIN", 3), user("first", "ADMIN", 2)];

  it("promotes the oldest admin and keeps the others as company admins", () => {
    expect(planCompanyMigration(users)).toEqual({ ok: true, superAdminId: "first", promote: true, adminIds: ["second"] });
  });

  it("promotes the admin with the given email instead", () => {
    expect(planCompanyMigration(users, "SECOND@jl.bo")).toEqual({
      ok: true,
      superAdminId: "second",
      promote: true,
      adminIds: ["first"],
    });
    expect(planCompanyMigration(users, "seller@jl.bo")).toEqual({ ok: false, reason: "No admin with the email seller@jl.bo." });
  });

  it("keeps an existing super admin, so running it again changes nobody's role", () => {
    const migrated = [...users, user("boss", "SUPER_ADMIN", 4)];
    expect(planCompanyMigration(migrated)).toEqual({ ok: true, superAdminId: "boss", promote: false, adminIds: ["first", "second"] });
  });

  it("refuses without any admin or with two super admins", () => {
    expect(planCompanyMigration([user("seller", "VEHICLE_USER", 1)]).ok).toBe(false);
    expect(planCompanyMigration([user("a", "SUPER_ADMIN", 1), user("b", "SUPER_ADMIN", 2)]).ok).toBe(false);
  });
});
