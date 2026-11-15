import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    stockPurchase: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import {
  createStockPurchase,
  deleteStockPurchase,
  repeatLastDayPurchases,
  updateStockPurchase,
} from "@/actions/stock-purchases";

const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN", companyId: "c1", permissions: ["FINANCE", "USERS", "GRAINS", "PRICES"] } };
const VEHICLE_SESSION = { user: { id: "user-1", role: "VEHICLE_USER", companyId: "c1", permissions: [] } };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const VALID_FIELDS = { product: "HABA", quantity: "50", unitCost: "6.5" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createStockPurchase", () => {
  it("rejects a non-admin session without touching the database", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    const result = await createStockPurchase({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.stockPurchase.create).not.toHaveBeenCalled();
  });

  it("rejects a quantity below 1", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase({ success: false }, formData({ ...VALID_FIELDS, quantity: "0" }));
    expect(result.success).toBe(false);
    expect(prismaMock.stockPurchase.create).not.toHaveBeenCalled();
  });

  it("rejects a negative unit cost", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, unitCost: "-1" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.stockPurchase.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid product", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MOTE" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.stockPurchase.create).not.toHaveBeenCalled();
  });

  it("creates a grain stock purchase tagged with the acting admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.create).toHaveBeenCalledWith({
      data: { product: "HABA", quantity: 50, unitCost: 6.5, companyId: "c1", createdById: "admin-1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });

  it.each(["QUESO", "YOGURT", "MILK"])("rejects a new %s purchase (no longer bought on a purchase page)", async (product) => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase({ success: false }, formData({ ...VALID_FIELDS, product }));
    expect(result.success).toBe(false);
    expect(prismaMock.stockPurchase.create).not.toHaveBeenCalled();
  });

  it("creates a MAIZ_PELADO stock purchase and revalidates the grains page", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MAIZ_PELADO" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.create).toHaveBeenCalledWith({
      data: { product: "MAIZ_PELADO", quantity: 50, unitCost: 6.5, companyId: "c1", createdById: "admin-1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });

  it("creates a MAIZ_CASCARA stock purchase and revalidates the grains page", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MAIZ_CASCARA" }),
    );
    expect(result).toEqual({ success: true });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });

  it("creates a HABA stock purchase and revalidates the grains page", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "HABA" }),
    );
    expect(result).toEqual({ success: true });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });
});

describe("updateStockPurchase", () => {
  it("rejects a non-admin session", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    const result = await updateStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, purchaseId: "p1", date: "2026-11-05" }),
    );
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.stockPurchase.update).not.toHaveBeenCalled();
  });

  it("returns an error when the purchase does not exist", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue(null);
    const result = await updateStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, purchaseId: "missing", date: "2026-11-05" }),
    );
    expect(result).toEqual({ success: false, error: "Stock purchase not found." });
    expect(prismaMock.stockPurchase.update).not.toHaveBeenCalled();
  });

  it("updates quantity, unit cost and date in place for an admin, keeping the time of day", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    // 2026-11-05 20:17 in Bolivia, moved to 2026-11-03.
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ companyId: "c1", id: "p1", product: "HABA", createdAt: new Date("2026-11-06T00:17:00Z") });
    const result = await updateStockPurchase(
      { success: false },
      formData({ quantity: "75", unitCost: "7", purchaseId: "p1", date: "2026-11-03" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { quantity: 75, unitCost: 7, createdAt: new Date("2026-11-04T00:17:00Z") },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });

  it("rejects a missing or future date", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const missing = await updateStockPurchase({ success: false }, formData({ quantity: "5", unitCost: "7", purchaseId: "p1" }));
    expect(missing).toEqual({ success: false, error: "Date is required." });
    const future = await updateStockPurchase(
      { success: false },
      formData({ quantity: "5", unitCost: "7", purchaseId: "p1", date: "2999-01-01" }),
    );
    expect(future).toEqual({ success: false, error: "Date can't be in the future." });
    expect(prismaMock.stockPurchase.update).not.toHaveBeenCalled();
  });

  it("only refreshes /dashboard and / when editing an old YOGURT purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ companyId: "c1", id: "p2", product: "YOGURT", createdAt: new Date("2026-11-05T15:00:00Z") });
    await updateStockPurchase({ success: false }, formData({ quantity: "75", unitCost: "7", purchaseId: "p2", date: "2026-11-05" }));
    expect(revalidatePathMock.mock.calls.map(([path]) => path).sort()).toEqual(["/", "/dashboard", "/dashboard"]);
  });

  it("revalidates the grains page when editing a MAIZ_PELADO purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ companyId: "c1", id: "p4", product: "MAIZ_PELADO", createdAt: new Date("2026-11-05T15:00:00Z") });
    await updateStockPurchase({ success: false }, formData({ quantity: "10", unitCost: "150", purchaseId: "p4", date: "2026-11-05" }));
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });

  it("revalidates the grains page when editing a HABA purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ companyId: "c1", id: "p5", product: "HABA", createdAt: new Date("2026-11-05T15:00:00Z") });
    await updateStockPurchase({ success: false }, formData({ quantity: "5", unitCost: "200", purchaseId: "p5", date: "2026-11-05" }));
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });
});

describe("deleteStockPurchase", () => {
  it("rejects a non-admin session", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    const result = await deleteStockPurchase("p1");
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.stockPurchase.delete).not.toHaveBeenCalled();
  });

  it("returns an error when the purchase does not exist", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue(null);
    const result = await deleteStockPurchase("missing");
    expect(result).toEqual({ success: false, error: "Stock purchase not found." });
    expect(prismaMock.stockPurchase.delete).not.toHaveBeenCalled();
  });

  it("treats another company's purchase as not found", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ companyId: "c2", id: "p1", product: "HABA" });
    expect(await deleteStockPurchase("p1")).toEqual({ success: false, error: "Stock purchase not found." });
    expect(prismaMock.stockPurchase.delete).not.toHaveBeenCalled();
  });

  it("rejects an admin without the Grains permission", async () => {
    authMock.mockResolvedValue({ user: { ...ADMIN_SESSION.user, permissions: ["FINANCE"] } });
    expect(await deleteStockPurchase("p1")).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.stockPurchase.findUnique).not.toHaveBeenCalled();
  });

  it("deletes the purchase for an admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ companyId: "c1", id: "p1", product: "HABA" });
    const result = await deleteStockPurchase("p1");
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });

  it("only refreshes /dashboard and / when deleting an old YOGURT purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ companyId: "c1", id: "p2", product: "YOGURT", createdAt: new Date("2026-11-05T15:00:00Z") });
    await deleteStockPurchase("p2");
    expect(revalidatePathMock.mock.calls.map(([path]) => path).sort()).toEqual(["/", "/dashboard", "/dashboard"]);
  });

  it("revalidates the grains page when deleting a MAIZ_CASCARA purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ companyId: "c1", id: "p4", product: "MAIZ_CASCARA", createdAt: new Date("2026-11-05T15:00:00Z") });
    await deleteStockPurchase("p4");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });
});

describe("repeatLastDayPurchases", () => {
  // 2026-11-06 10:00 in Bolivia.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-06T14:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const LAST_DAY_GRAINS = [
    { product: "MAIZ_PELADO", quantity: 4, unitCost: 26.25, createdAt: new Date("2026-11-06T00:16:41Z") },
    { product: "MAIZ_CASCARA", quantity: 10, unitCost: 30.62, createdAt: new Date("2026-11-06T00:17:03Z") },
  ];

  it("rejects a non-admin session without touching the database", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    expect(await repeatLastDayPurchases()).toEqual({ success: false, error: "notAuthorized" });
    expect(prismaMock.stockPurchase.createMany).not.toHaveBeenCalled();
  });

  it("copies every grain item of the last day", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const grains = LAST_DAY_GRAINS;
    prismaMock.stockPurchase.findFirst.mockResolvedValue({ createdAt: grains[1].createdAt });
    prismaMock.stockPurchase.findMany.mockResolvedValue(grains);

    expect(await repeatLastDayPurchases()).toEqual({ success: true, count: 2 });
    expect(prismaMock.stockPurchase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: "c1", product: { in: ["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"] } }),
      }),
    );
    expect(prismaMock.stockPurchase.createMany).toHaveBeenCalledWith({
      data: [
        { product: "MAIZ_PELADO", quantity: 4, unitCost: 26.25, companyId: "c1", createdById: "admin-1" },
        { product: "MAIZ_CASCARA", quantity: 10, unitCost: 30.62, companyId: "c1", createdById: "admin-1" },
      ],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("refuses when today already has purchases", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const today = [{ ...LAST_DAY_GRAINS[0], createdAt: new Date("2026-11-06T13:00:00Z") }];
    prismaMock.stockPurchase.findFirst.mockResolvedValue({ createdAt: today[0].createdAt });
    prismaMock.stockPurchase.findMany.mockResolvedValue(today);

    expect(await repeatLastDayPurchases()).toEqual({ success: false, error: "alreadyToday" });
    expect(prismaMock.stockPurchase.createMany).not.toHaveBeenCalled();
  });

  it("refuses when there are no purchases yet", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findFirst.mockResolvedValue(null);

    expect(await repeatLastDayPurchases()).toEqual({ success: false, error: "nothingToCopy" });
    expect(prismaMock.stockPurchase.createMany).not.toHaveBeenCalled();
  });
});
