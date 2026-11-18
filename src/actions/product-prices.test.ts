import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    productPrice: {
      upsert: vi.fn(),
    },
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { setProductPrice } from "@/actions/product-prices";

const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN", companyId: "c1", permissions: ["FINANCE", "USERS", "GRAINS", "PRICES"] } };
const VEHICLE_SESSION = { user: { id: "user-1", role: "VEHICLE_USER", companyId: "c1", permissions: [] } };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const VALID_FIELDS = { product: "QUESO", salePrice: "10", purchaseCost: "9" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setProductPrice", () => {
  it("rejects an unauthenticated session without touching the database", async () => {
    authMock.mockResolvedValue(null);
    const result = await setProductPrice({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.productPrice.upsert).not.toHaveBeenCalled();
  });

  it("rejects a non-admin session", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    const result = await setProductPrice({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.productPrice.upsert).not.toHaveBeenCalled();
  });

  it("rejects an admin without the Prices permission", async () => {
    authMock.mockResolvedValue({ user: { ...ADMIN_SESSION.user, permissions: ["FINANCE", "GRAINS"] } });
    const result = await setProductPrice({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.productPrice.upsert).not.toHaveBeenCalled();
  });

  it("rejects a negative price", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await setProductPrice(
      { success: false },
      formData({ ...VALID_FIELDS, salePrice: "-1" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.productPrice.upsert).not.toHaveBeenCalled();
  });

  it("rejects a negative purchase cost", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await setProductPrice({ success: false }, formData({ ...VALID_FIELDS, purchaseCost: "-1" }));
    expect(result.success).toBe(false);
    expect(prismaMock.productPrice.upsert).not.toHaveBeenCalled();
  });

  it("rejects a missing purchase cost", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await setProductPrice({ success: false }, formData({ product: "QUESO", salePrice: "10" }));
    expect(result.success).toBe(false);
    expect(prismaMock.productPrice.upsert).not.toHaveBeenCalled();
  });

  it("upserts the product's price row in place, tagged with the acting admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await setProductPrice({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: true });
    expect(prismaMock.productPrice.upsert).toHaveBeenCalledWith({
      where: { companyId_product: { companyId: "c1", product: "QUESO" } },
      update: { salePrice: 10, purchaseCost: 9, setById: "admin-1" },
      create: { companyId: "c1", product: "QUESO", salePrice: 10, purchaseCost: 9, setById: "admin-1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });
});
