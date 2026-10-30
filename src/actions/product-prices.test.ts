import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    productPrice: {
      create: vi.fn(),
    },
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { setProductPrice } from "@/actions/product-prices";

const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN" } };
const VEHICLE_SESSION = { user: { id: "user-1", role: "VEHICLE_USER" } };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const VALID_FIELDS = { product: "QUESO", purchasePrice: "8", salePrice: "10" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setProductPrice", () => {
  it("rejects an unauthenticated session without touching the database", async () => {
    authMock.mockResolvedValue(null);
    const result = await setProductPrice({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.productPrice.create).not.toHaveBeenCalled();
  });

  it("rejects a non-admin session", async () => {
    authMock.mockResolvedValue(VEHICLE_SESSION);
    const result = await setProductPrice({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.productPrice.create).not.toHaveBeenCalled();
  });

  it("rejects a negative price", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await setProductPrice(
      { success: false },
      formData({ ...VALID_FIELDS, salePrice: "-1" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.productPrice.create).not.toHaveBeenCalled();
  });

  it("inserts a new price row for an admin, tagged with the acting admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await setProductPrice({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: true });
    expect(prismaMock.productPrice.create).toHaveBeenCalledWith({
      data: {
        product: "QUESO",
        purchasePrice: 8,
        salePrice: 10,
        setById: "admin-1",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/products");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });
});
