import { describe, expect, it } from "vitest";
import { ADMIN_PERMISSIONS, hasPermission, isAdminRole, toAccessClaims, type StoredUserAccess } from "@/lib/auth/permissions";

const user = (overrides: Partial<StoredUserAccess>): StoredUserAccess => ({
  role: "VEHICLE_USER",
  companyId: "c1",
  permissions: [],
  isActive: true,
  company: { isActive: true },
  ...overrides,
});

describe("toAccessClaims", () => {
  it("gives the super admin every permission and no company", () => {
    expect(toAccessClaims(user({ role: "SUPER_ADMIN", companyId: null, company: null }))).toEqual({
      role: "SUPER_ADMIN",
      companyId: null,
      permissions: ADMIN_PERMISSIONS,
    });
  });

  it("keeps only a company admin's granted permissions, a seller none", () => {
    expect(toAccessClaims(user({ role: "ADMIN", permissions: ["GRAINS", "FINANCE"] }))).toEqual({
      role: "ADMIN",
      companyId: "c1",
      permissions: ["FINANCE", "GRAINS"],
    });
    expect(toAccessClaims(user({ permissions: ["USERS"] }))?.permissions).toEqual([]);
  });

  it("refuses a deactivated user, a deactivated company and a user without company", () => {
    expect(toAccessClaims(user({ isActive: false }))).toBeNull();
    expect(toAccessClaims(user({ role: "ADMIN", company: { isActive: false } }))).toBeNull();
    expect(toAccessClaims(user({ companyId: null, company: null }))).toBeNull();
    expect(toAccessClaims(user({ role: "SUPER_ADMIN", isActive: false, companyId: null, company: null }))).toBeNull();
  });
});

describe("hasPermission / isAdminRole", () => {
  it("lets the super admin do everything and an admin only what was granted", () => {
    expect(hasPermission({ role: "SUPER_ADMIN", permissions: [] }, "USERS")).toBe(true);
    expect(hasPermission({ role: "ADMIN", permissions: ["GRAINS"] }, "GRAINS")).toBe(true);
    expect(hasPermission({ role: "ADMIN", permissions: ["GRAINS"] }, "FINANCE")).toBe(false);
    expect(hasPermission({ role: "VEHICLE_USER", permissions: ["FINANCE"] }, "FINANCE")).toBe(false);
    expect([isAdminRole("SUPER_ADMIN"), isAdminRole("ADMIN"), isAdminRole("VEHICLE_USER")]).toEqual([true, true, false]);
  });
});
