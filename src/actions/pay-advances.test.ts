import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    payAdvance: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { createPayAdvance, deletePayAdvance, updatePayAdvance } from "@/actions/pay-advances";

const ADMIN_SESSION = { user: { id: "ad0000000000000000000001", role: "ADMIN", companyId: "c1", permissions: [] } };
const VEHICLE_SESSION = { user: { id: "aa0000000000000000000001", role: "VEHICLE_USER", companyId: "c1", permissions: [] } };
const SELLER_ID = "aa0000000000000000000002";
const ADVANCE_ID = "bb0000000000000000000001";
const SELLER = { id: SELLER_ID, companyId: "c1", role: "VEHICLE_USER", isActive: true };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const VALID_FIELDS = { date: "2026-11-05", amount: "200", description: " Pasaje " };

beforeEach(() => {
  vi.clearAllMocks();
  // 2026-11-06 10:00 in Bolivia.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-06T14:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("createPayAdvance", () => {
  it("rejects a seller session without touching the database", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    const result = await createPayAdvance({ success: false }, formData({ ...VALID_FIELDS, userId: SELLER_ID }));
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.payAdvance.create).not.toHaveBeenCalled();
  });

  it.each([
    [{ amount: "0" }, "Amount must be at least 1."],
    [{ amount: "10.5" }, "Amount must be a whole number."],
    [{ date: "2026-11-07" }, "Date can't be in the future."],
    [{ description: "x".repeat(201) }, "Description is too long."],
    [{ userId: "nope" }, "User not found."],
  ])("rejects %j", async (override, error) => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createPayAdvance({ success: false }, formData({ ...VALID_FIELDS, userId: SELLER_ID, ...override }));
    expect(result).toEqual({ success: false, error });
    expect(prismaMock.payAdvance.create).not.toHaveBeenCalled();
  });

  it.each([
    ["another company's seller", { ...SELLER, companyId: "c2" }],
    ["an inactive seller", { ...SELLER, isActive: false }],
  ])("refuses %s", async (_label, user) => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(user);
    const result = await createPayAdvance({ success: false }, formData({ ...VALID_FIELDS, userId: SELLER_ID }));
    expect(result).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.payAdvance.create).not.toHaveBeenCalled();
  });

  it("also gives advances to an admin of the company (admins work too)", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ ...SELLER, role: "ADMIN" });
    const result = await createPayAdvance({ success: false }, formData({ ...VALID_FIELDS, userId: SELLER_ID }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.payAdvance.create).toHaveBeenCalled();
  });

  it("creates the advance for the company's seller", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(SELLER);
    const result = await createPayAdvance({ success: false }, formData({ ...VALID_FIELDS, userId: SELLER_ID }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.payAdvance.create).toHaveBeenCalledWith({
      data: {
        companyId: "c1",
        userId: SELLER_ID,
        date: new Date("2026-11-05T00:00:00.000Z"),
        amount: 200,
        description: "Pasaje",
        createdById: "ad0000000000000000000001",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });
});

describe("updatePayAdvance", () => {
  it("treats another company's advance as not found", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.payAdvance.findUnique.mockResolvedValue({ id: ADVANCE_ID, companyId: "c2" });
    const result = await updatePayAdvance({ success: false }, formData({ ...VALID_FIELDS, advanceId: ADVANCE_ID }));
    expect(result).toEqual({ success: false, error: "Advance not found." });
    expect(prismaMock.payAdvance.update).not.toHaveBeenCalled();
  });

  it("rejects a malformed id without a lookup", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await updatePayAdvance({ success: false }, formData({ ...VALID_FIELDS, advanceId: "x" }));
    expect(result).toEqual({ success: false, error: "Advance not found." });
    expect(prismaMock.payAdvance.findUnique).not.toHaveBeenCalled();
  });

  it("updates date, amount and description", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.payAdvance.findUnique.mockResolvedValue({ id: ADVANCE_ID, companyId: "c1" });
    const result = await updatePayAdvance({ success: false }, formData({ ...VALID_FIELDS, amount: "150", advanceId: ADVANCE_ID }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.payAdvance.update).toHaveBeenCalledWith({
      where: { id: ADVANCE_ID },
      data: { date: new Date("2026-11-05T00:00:00.000Z"), amount: 150, description: "Pasaje" },
    });
  });
});

describe("deletePayAdvance", () => {
  it("rejects a seller session", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    expect(await deletePayAdvance(ADVANCE_ID)).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.payAdvance.delete).not.toHaveBeenCalled();
  });

  it("treats another company's advance as not found", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.payAdvance.findUnique.mockResolvedValue({ id: ADVANCE_ID, companyId: "c2" });
    expect(await deletePayAdvance(ADVANCE_ID)).toEqual({ success: false, error: "Advance not found." });
    expect(prismaMock.payAdvance.delete).not.toHaveBeenCalled();
  });

  it("deletes the company's advance", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.payAdvance.findUnique.mockResolvedValue({ id: ADVANCE_ID, companyId: "c1" });
    expect(await deletePayAdvance(ADVANCE_ID)).toEqual({ success: true });
    expect(prismaMock.payAdvance.delete).toHaveBeenCalledWith({ where: { id: ADVANCE_ID } });
  });
});

describe("paid-off advances can't be edited or deleted", () => {
  it("treats a settled advance as not found", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.payAdvance.findUnique.mockResolvedValue({ id: ADVANCE_ID, companyId: "c1", settledAt: new Date() });
    expect(await deletePayAdvance(ADVANCE_ID)).toEqual({ success: false, error: "Advance not found." });
    const result = await updatePayAdvance({ success: false }, formData({ ...VALID_FIELDS, advanceId: ADVANCE_ID }));
    expect(result).toEqual({ success: false, error: "Advance not found." });
    expect(prismaMock.payAdvance.delete).not.toHaveBeenCalled();
    expect(prismaMock.payAdvance.update).not.toHaveBeenCalled();
  });
});

