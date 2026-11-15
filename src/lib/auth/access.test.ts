import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, cookieValue } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: { company: { findUnique: vi.fn(), findFirst: vi.fn() } },
  cookieValue: { current: undefined as string | undefined },
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieValue.current ? { value: cookieValue.current } : undefined) }),
}));

import { getAccess, requireAdminAccess, requireCompanyAccess } from "@/lib/auth/access";

const CHOSEN = "64b000000000000000000002";
const OLDEST = "64b000000000000000000001";
const SUPER_SESSION = { user: { id: "super-1", name: "Ana", role: "SUPER_ADMIN", companyId: null, permissions: [] } };

beforeEach(() => {
  vi.clearAllMocks();
  cookieValue.current = undefined;
  prismaMock.company.findFirst.mockResolvedValue({ id: OLDEST });
});

describe("getAccess", () => {
  it("binds a company user to their own company, ignoring the switcher cookie", async () => {
    cookieValue.current = CHOSEN;
    authMock.mockResolvedValue({ user: { id: "a1", name: "Luis", role: "ADMIN", companyId: OLDEST, permissions: ["GRAINS"] } });
    expect(await getAccess()).toEqual({
      userId: "a1",
      userName: "Luis",
      role: "ADMIN",
      companyId: OLDEST,
      permissions: ["GRAINS"],
      isAdmin: true,
      isSuperAdmin: false,
    });
    expect(prismaMock.company.findUnique).not.toHaveBeenCalled();
  });

  it("puts the super admin in the switcher's company when it exists, else the oldest", async () => {
    authMock.mockResolvedValue(SUPER_SESSION);
    cookieValue.current = CHOSEN;
    prismaMock.company.findUnique.mockResolvedValue({ id: CHOSEN });
    expect((await getAccess())?.companyId).toBe(CHOSEN);

    prismaMock.company.findUnique.mockResolvedValue(null);
    expect((await getAccess())?.companyId).toBe(OLDEST);

    cookieValue.current = "garbage";
    prismaMock.company.findUnique.mockClear();
    expect((await getAccess())?.companyId).toBe(OLDEST);
    expect(prismaMock.company.findUnique).not.toHaveBeenCalled();
  });

  it("has no access for a signed-out user or a super admin before any company exists", async () => {
    authMock.mockResolvedValue(null);
    expect(await getAccess()).toBeNull();
    await expect(requireCompanyAccess()).rejects.toThrow("Sign-in required.");

    authMock.mockResolvedValue(SUPER_SESSION);
    prismaMock.company.findFirst.mockResolvedValue(null);
    expect(await getAccess()).toBeNull();
    await expect(requireCompanyAccess()).rejects.toThrow("Create a company first.");
  });
});

describe("requireAdminAccess", () => {
  it("checks the admin role and the permission asked for", async () => {
    authMock.mockResolvedValue({ user: { id: "a1", role: "ADMIN", companyId: OLDEST, permissions: ["GRAINS"] } });
    await expect(requireAdminAccess("GRAINS")).resolves.toMatchObject({ companyId: OLDEST });
    await expect(requireAdminAccess("FINANCE")).rejects.toThrow("Admin access required.");

    authMock.mockResolvedValue({ user: { id: "s1", role: "VEHICLE_USER", companyId: OLDEST, permissions: [] } });
    await expect(requireAdminAccess()).rejects.toThrow("Admin access required.");

    authMock.mockResolvedValue(SUPER_SESSION);
    await expect(requireAdminAccess("FINANCE")).resolves.toMatchObject({ isSuperAdmin: true, companyId: OLDEST });
  });
});
