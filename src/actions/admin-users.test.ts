import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, hashPasswordMock, revalidatePathMock, cookieValue } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    company: { findUnique: vi.fn(), findFirst: vi.fn() },
  },
  hashPasswordMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  cookieValue: { current: undefined as string | undefined },
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: hashPasswordMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieValue.current ? { value: cookieValue.current } : undefined) }),
}));

import { createUser, updateUser, setUserActive } from "@/actions/admin-users";

const COMPANY = "64b000000000000000000001";
const OTHER_COMPANY = "64b000000000000000000002";
const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN", companyId: COMPANY, permissions: ["USERS"] } };
const ADMIN_WITHOUT_USERS = { user: { id: "admin-2", role: "ADMIN", companyId: COMPANY, permissions: ["FINANCE"] } };
const SUPER_SESSION = { user: { id: "super-1", role: "SUPER_ADMIN", companyId: null, permissions: [] } };
const NON_ADMIN_SESSION = { user: { id: "user-1", role: "VEHICLE_USER", companyId: COMPANY, permissions: [] } };

const seller = (overrides = {}) => ({ id: "u1", role: "VEHICLE_USER", companyId: COMPANY, ...overrides });

function formData(fields: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of Array.isArray(value) ? value : [value]) fd.append(key, v);
  }
  return fd;
}

const NEW_SELLER = { name: "A", email: "new@b.com", password: "longenough", role: "VEHICLE_USER" };
const EDIT_SELLER = { userId: "u1", name: "A", email: "a@b.com", role: "VEHICLE_USER", newPassword: "" };

beforeEach(() => {
  vi.clearAllMocks();
  cookieValue.current = COMPANY;
  hashPasswordMock.mockImplementation(async (pw: string) => `hashed:${pw}`);
  prismaMock.company.findUnique.mockResolvedValue({ id: COMPANY });
  prismaMock.user.findFirst.mockResolvedValue(null);
});

describe("createUser", () => {
  it("rejects a seller and an admin without the Users permission", async () => {
    for (const session of [NON_ADMIN_SESSION, ADMIN_WITHOUT_USERS]) {
      authMock.mockResolvedValue(session);
      expect(await createUser({ success: false }, formData(NEW_SELLER))).toEqual({
        success: false,
        error: "Admin access required.",
      });
    }
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns a validation error for a short password", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createUser({ success: false }, formData({ ...NEW_SELLER, password: "short" }));
    expect(result.success).toBe(false);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" });
    const result = await createUser({ success: false }, formData(NEW_SELLER));
    expect(result).toEqual({ success: false, error: "A user with this email already exists." });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("creates a seller in the admin's own company, ignoring any permissions sent", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await createUser({ success: false }, formData({ ...NEW_SELLER, permissions: ["FINANCE"] }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        name: "A",
        email: "new@b.com",
        passwordHash: "hashed:longenough",
        role: "VEHICLE_USER",
        companyId: COMPANY,
        permissions: [],
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });

  it("lets only the super admin create an admin, with the permissions ticked", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect(await createUser({ success: false }, formData({ ...NEW_SELLER, role: "ADMIN" }))).toEqual({
      success: false,
      error: "Only the super admin can manage admins.",
    });

    authMock.mockResolvedValue(SUPER_SESSION);
    const result = await createUser(
      { success: false },
      formData({ ...NEW_SELLER, role: "ADMIN", permissions: ["GRAINS", "FINANCE", "BOGUS"] }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.create.mock.calls[0][0].data).toMatchObject({
      role: "ADMIN",
      companyId: COMPANY,
      permissions: ["FINANCE", "GRAINS"],
    });
  });

  it("never accepts the super admin role", async () => {
    authMock.mockResolvedValue(SUPER_SESSION);
    const result = await createUser({ success: false }, formData({ ...NEW_SELLER, role: "SUPER_ADMIN" }));
    expect(result.success).toBe(false);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe("updateUser", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(seller());
  });

  it("rejects a non-admin session", async () => {
    authMock.mockResolvedValue(NON_ADMIN_SESSION);
    const result = await updateUser({ success: false }, formData(EDIT_SELLER));
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("does not hash or touch the password when newPassword is blank", async () => {
    const result = await updateUser({ success: false }, formData(EDIT_SELLER));
    expect(result).toEqual({ success: true });
    expect(hashPasswordMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "A", email: "a@b.com", role: "VEHICLE_USER", permissions: [] },
    });
  });

  it("hashes and includes the password when newPassword is provided", async () => {
    await updateUser({ success: false }, formData({ ...EDIT_SELLER, newPassword: "longenough" }));
    expect(hashPasswordMock).toHaveBeenCalledWith("longenough");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "A", email: "a@b.com", role: "VEHICLE_USER", permissions: [], passwordHash: "hashed:longenough" },
    });
  });

  it("treats another company's user and the super admin as not found", async () => {
    for (const target of [seller({ companyId: OTHER_COMPANY }), seller({ role: "SUPER_ADMIN", companyId: null }), null]) {
      prismaMock.user.findUnique.mockResolvedValue(target);
      expect(await updateUser({ success: false }, formData(EDIT_SELLER))).toEqual({
        success: false,
        error: "User not found.",
      });
    }
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("keeps a company admin from changing an admin or promoting a seller", async () => {
    prismaMock.user.findUnique.mockResolvedValue(seller({ role: "ADMIN" }));
    expect((await updateUser({ success: false }, formData(EDIT_SELLER))).error).toBe("Only the super admin can manage admins.");

    prismaMock.user.findUnique.mockResolvedValue(seller());
    expect((await updateUser({ success: false }, formData({ ...EDIT_SELLER, role: "ADMIN" }))).error).toBe(
      "Only the super admin can manage admins.",
    );
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("lets the super admin change an admin's permissions in the company it has open", async () => {
    authMock.mockResolvedValue(SUPER_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(seller({ role: "ADMIN" }));
    await updateUser({ success: false }, formData({ ...EDIT_SELLER, role: "ADMIN", permissions: ["USERS", "PRICES"] }));
    expect(prismaMock.user.update.mock.calls[0][0].data).toMatchObject({ role: "ADMIN", permissions: ["USERS", "PRICES"] });

    // Open another company: the same admin is out of reach.
    cookieValue.current = OTHER_COMPANY;
    prismaMock.company.findUnique.mockResolvedValue({ id: OTHER_COMPANY });
    expect((await updateUser({ success: false }, formData(EDIT_SELLER))).error).toBe("User not found.");
  });
});

describe("setUserActive", () => {
  it("rejects a non-admin session", async () => {
    authMock.mockResolvedValue(NON_ADMIN_SESSION);
    expect(await setUserActive("u1", false)).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("updates isActive and revalidates for an admin of the user's company", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(seller());
    expect(await setUserActive("u1", false)).toEqual({ success: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { isActive: false } });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });

  it("refuses another company's user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(seller({ companyId: OTHER_COMPANY }));
    expect(await setUserActive("u1", false)).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
