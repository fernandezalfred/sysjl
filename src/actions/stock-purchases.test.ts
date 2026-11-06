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
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
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

const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN" } };
const VEHICLE_SESSION = { user: { id: "user-1", role: "VEHICLE_USER" } };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const VALID_FIELDS = { product: "QUESO", quantity: "50", unitCost: "6.5" };

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

  it("creates a QUESO stock purchase tagged with the acting admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.create).toHaveBeenCalledWith({
      data: { product: "QUESO", quantity: 50, unitCost: 6.5, createdById: "admin-1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/cheese");
  });

  it("creates a YOGURT stock purchase and revalidates the yogurt page", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "YOGURT" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.create).toHaveBeenCalledWith({
      data: { product: "YOGURT", quantity: 50, unitCost: 6.5, createdById: "admin-1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/yogurt");
  });

  it("creates a MILK stock purchase tagged with the acting admin and the selected driver", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ id: "driver-1", role: "VEHICLE_USER", isActive: true });
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MILK", forUserId: "driver-1" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.create).toHaveBeenCalledWith({
      data: { product: "MILK", quantity: 50, unitCost: 6.5, createdById: "admin-1", forUserId: "driver-1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/milk");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("rejects a MILK purchase with no driver selected", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MILK" }),
    );
    expect(result).toEqual({ success: false, error: "Select a user." });
    expect(prismaMock.stockPurchase.create).not.toHaveBeenCalled();
  });

  it("rejects a MILK purchase attributed to a non-existent user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MILK", forUserId: "missing" }),
    );
    expect(result).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.stockPurchase.create).not.toHaveBeenCalled();
  });

  it("accepts a MILK purchase attributed to an active admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ id: "admin-2", role: "ADMIN", isActive: true });
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MILK", forUserId: "admin-2" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ forUserId: "admin-2" }) }),
    );
  });

  it("rejects a MILK purchase attributed to a deactivated user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ id: "driver-2", role: "VEHICLE_USER", isActive: false });
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MILK", forUserId: "driver-2" }),
    );
    expect(result).toEqual({ success: false, error: "User not found." });
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
      data: { product: "MAIZ_PELADO", quantity: 50, unitCost: 6.5, createdById: "admin-1" },
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
      formData({ ...VALID_FIELDS, purchaseId: "p1" }),
    );
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.stockPurchase.update).not.toHaveBeenCalled();
  });

  it("returns an error when the purchase does not exist", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue(null);
    const result = await updateStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, purchaseId: "missing" }),
    );
    expect(result).toEqual({ success: false, error: "Stock purchase not found." });
    expect(prismaMock.stockPurchase.update).not.toHaveBeenCalled();
  });

  it("updates quantity and unit cost in place for an admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p1", product: "QUESO" });
    const result = await updateStockPurchase(
      { success: false },
      formData({ quantity: "75", unitCost: "7", purchaseId: "p1" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { quantity: 75, unitCost: 7 },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/cheese");
  });

  it("revalidates the yogurt page when editing a YOGURT purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p2", product: "YOGURT" });
    await updateStockPurchase({ success: false }, formData({ quantity: "75", unitCost: "7", purchaseId: "p2" }));
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/yogurt");
  });

  it("revalidates the milk page when editing a MILK purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p3", product: "MILK" });
    await updateStockPurchase({ success: false }, formData({ quantity: "20", unitCost: "4", purchaseId: "p3" }));
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/milk");
  });

  it("revalidates the grains page when editing a MAIZ_PELADO purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p4", product: "MAIZ_PELADO" });
    await updateStockPurchase({ success: false }, formData({ quantity: "10", unitCost: "150", purchaseId: "p4" }));
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });

  it("revalidates the grains page when editing a HABA purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p5", product: "HABA" });
    await updateStockPurchase({ success: false }, formData({ quantity: "5", unitCost: "200", purchaseId: "p5" }));
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

  it("deletes the purchase for an admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p1", product: "QUESO" });
    const result = await deleteStockPurchase("p1");
    expect(result).toEqual({ success: true });
    expect(prismaMock.stockPurchase.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/cheese");
  });

  it("revalidates the yogurt page when deleting a YOGURT purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p2", product: "YOGURT" });
    await deleteStockPurchase("p2");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/yogurt");
  });

  it("revalidates the milk page when deleting a MILK purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p3", product: "MILK" });
    await deleteStockPurchase("p3");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/milk");
  });

  it("revalidates the grains page when deleting a MAIZ_CASCARA purchase", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findUnique.mockResolvedValue({ id: "p4", product: "MAIZ_CASCARA" });
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

  const LAST_DAY_MILK = [
    { product: "MILK", quantity: 30, unitCost: 7, createdAt: new Date("2026-11-06T00:17:19Z"), forUserId: "raul" },
    { product: "MILK", quantity: 26, unitCost: 7, createdAt: new Date("2026-11-06T00:17:39Z"), forUserId: "daniel" },
  ];

  it("rejects a non-admin session without touching the database", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    expect(await repeatLastDayPurchases("MILK")).toEqual({ success: false, error: "notAuthorized" });
    expect(prismaMock.stockPurchase.createMany).not.toHaveBeenCalled();
  });

  it("copies the last day's Milk into today for each active user, entered by the current admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findFirst.mockResolvedValue({ createdAt: LAST_DAY_MILK[1].createdAt });
    prismaMock.stockPurchase.findMany.mockResolvedValue(LAST_DAY_MILK);
    prismaMock.user.findMany.mockResolvedValue([{ id: "raul" }, { id: "daniel" }]);

    expect(await repeatLastDayPurchases("MILK")).toEqual({ success: true, count: 2 });
    expect(prismaMock.stockPurchase.createMany).toHaveBeenCalledWith({
      data: [
        { product: "MILK", quantity: 30, unitCost: 7, createdById: "admin-1", forUserId: "raul" },
        { product: "MILK", quantity: 26, unitCost: 7, createdById: "admin-1", forUserId: "daniel" },
      ],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/milk");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("copies every grain item of the last day", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const grains = [
      { product: "MAIZ_PELADO", quantity: 4, unitCost: 26.25, createdAt: new Date("2026-11-06T00:16:41Z"), forUserId: null },
      { product: "MAIZ_CASCARA", quantity: 10, unitCost: 30.62, createdAt: new Date("2026-11-06T00:17:03Z"), forUserId: null },
    ];
    prismaMock.stockPurchase.findFirst.mockResolvedValue({ createdAt: grains[1].createdAt });
    prismaMock.stockPurchase.findMany.mockResolvedValue(grains);

    expect(await repeatLastDayPurchases("GRAINS")).toEqual({ success: true, count: 2 });
    expect(prismaMock.stockPurchase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ product: { in: ["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"] } }) }),
    );
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    expect(prismaMock.stockPurchase.createMany).toHaveBeenCalledWith({
      data: [
        { product: "MAIZ_PELADO", quantity: 4, unitCost: 26.25, createdById: "admin-1", forUserId: null },
        { product: "MAIZ_CASCARA", quantity: 10, unitCost: 30.62, createdById: "admin-1", forUserId: null },
      ],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/grains");
  });

  it("refuses when today already has purchases", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const today = [{ ...LAST_DAY_MILK[0], createdAt: new Date("2026-11-06T13:00:00Z") }];
    prismaMock.stockPurchase.findFirst.mockResolvedValue({ createdAt: today[0].createdAt });
    prismaMock.stockPurchase.findMany.mockResolvedValue(today);
    prismaMock.user.findMany.mockResolvedValue([{ id: "raul" }]);

    expect(await repeatLastDayPurchases("MILK")).toEqual({ success: false, error: "alreadyToday" });
    expect(prismaMock.stockPurchase.createMany).not.toHaveBeenCalled();
  });

  it("refuses when there are no purchases yet", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.stockPurchase.findFirst.mockResolvedValue(null);

    expect(await repeatLastDayPurchases("GRAINS")).toEqual({ success: false, error: "nothingToCopy" });
    expect(prismaMock.stockPurchase.createMany).not.toHaveBeenCalled();
  });
});
