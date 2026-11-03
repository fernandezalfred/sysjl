import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    stockPurchase: {
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

import { createStockPurchase, deleteStockPurchase, updateStockPurchase } from "@/actions/stock-purchases";

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

  it("rejects a MILK purchase attributed to an admin instead of a vehicle user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ id: "admin-2", role: "ADMIN", isActive: true });
    const result = await createStockPurchase(
      { success: false },
      formData({ ...VALID_FIELDS, product: "MILK", forUserId: "admin-2" }),
    );
    expect(result).toEqual({ success: false, error: "Selected user is not a vehicle user." });
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
