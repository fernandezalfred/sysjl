import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock, cookieSet } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    company: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
  revalidatePathMock: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: cookieSet }) }));

import { createCompany, renameCompany, setActiveCompany, setCompanyActive } from "@/actions/companies";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/auth/access";

const COMPANY = "64b000000000000000000001";
const SUPER_SESSION = { user: { id: "super-1", role: "SUPER_ADMIN", companyId: null, permissions: [] } };
const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN", companyId: COMPANY, permissions: ["USERS"] } };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(SUPER_SESSION);
  prismaMock.company.findFirst.mockResolvedValue(null);
  prismaMock.company.findUnique.mockResolvedValue({ id: COMPANY });
});

describe("company actions", () => {
  it("are the super admin's only, even for a company admin with every permission", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const denied = { success: false, error: "Super admin access required." };
    expect(await createCompany({ success: false }, formData({ name: "Nueva" }))).toEqual(denied);
    expect(await renameCompany({ success: false }, formData({ companyId: COMPANY, name: "X" }))).toEqual(denied);
    expect(await setCompanyActive(COMPANY, false)).toEqual(denied);
    expect(await setActiveCompany(COMPANY)).toEqual(denied);
    expect(prismaMock.company.create).not.toHaveBeenCalled();
    expect(prismaMock.company.update).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

describe("createCompany", () => {
  it("creates a company with the trimmed name and opens it", async () => {
    prismaMock.company.create.mockResolvedValue({ id: COMPANY });
    expect(await createCompany({ success: false }, formData({ name: "  Lácteos Sur " }))).toEqual({ success: true });
    expect(prismaMock.company.create).toHaveBeenCalledWith({ data: { name: "Lácteos Sur" } });
    expect(cookieSet).toHaveBeenCalledWith(ACTIVE_COMPANY_COOKIE, COMPANY, expect.objectContaining({ httpOnly: true }));
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects an empty or taken name", async () => {
    expect(await createCompany({ success: false }, formData({ name: "  " }))).toEqual({
      success: false,
      error: "Company name is required.",
    });
    prismaMock.company.findFirst.mockResolvedValue({ id: "other" });
    expect(await createCompany({ success: false }, formData({ name: "JL" }))).toEqual({
      success: false,
      error: "A company with this name already exists.",
    });
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });
});

describe("renameCompany / setCompanyActive / setActiveCompany", () => {
  it("renames, deactivates and opens an existing company", async () => {
    expect(await renameCompany({ success: false }, formData({ companyId: COMPANY, name: "JL Norte" }))).toEqual({ success: true });
    expect(prismaMock.company.update).toHaveBeenCalledWith({ where: { id: COMPANY }, data: { name: "JL Norte" } });

    expect(await setCompanyActive(COMPANY, false)).toEqual({ success: true });
    expect(prismaMock.company.update).toHaveBeenLastCalledWith({ where: { id: COMPANY }, data: { isActive: false } });

    expect(await setActiveCompany(COMPANY)).toEqual({ success: true });
    expect(cookieSet).toHaveBeenCalledWith(ACTIVE_COMPANY_COOKIE, COMPANY, expect.any(Object));
  });

  it("refuses an unknown or malformed company id", async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);
    const notFound = { success: false, error: "Company not found." };
    expect(await setActiveCompany(COMPANY)).toEqual(notFound);
    expect(await setActiveCompany("not-an-id")).toEqual(notFound);
    expect(await setCompanyActive(COMPANY, true)).toEqual(notFound);
    expect(await renameCompany({ success: false }, formData({ companyId: COMPANY, name: "X" }))).toEqual(notFound);
    expect(cookieSet).not.toHaveBeenCalled();
    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });
});
