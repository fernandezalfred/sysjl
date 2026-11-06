import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    productPrice: { findUnique: vi.fn() },
    stockPurchase: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { getCurrentPurchaseCosts, getCurrentSalePrices } from "@/lib/money/product-prices";

const UPDATED_AT = new Date("2026-11-06T14:00:00Z");

function priceRow(salePrice: number, purchaseCost?: number) {
  return { salePrice, purchaseCost: purchaseCost ?? null, updatedAt: UPDATED_AT, setBy: { name: "Admin" } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentPurchaseCosts", () => {
  it("uses the purchase cost set on the price row", async () => {
    prismaMock.productPrice.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(where.product === "QUESO" ? priceRow(12, 9.5) : priceRow(40, 34)),
    );

    expect(await getCurrentPurchaseCosts()).toEqual({ QUESO: 9.5, YOGURT: 34 });
    expect(prismaMock.stockPurchase.findFirst).not.toHaveBeenCalled();
  });

  it("falls back to the last recorded purchase cost when none is set", async () => {
    prismaMock.productPrice.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(where.product === "QUESO" ? priceRow(12) : null),
    );
    prismaMock.stockPurchase.findFirst.mockImplementation(({ where }) =>
      Promise.resolve(where.product === "QUESO" ? { unitCost: 9 } : { unitCost: 33 }),
    );

    expect(await getCurrentPurchaseCosts()).toEqual({ QUESO: 9, YOGURT: 33 });
  });

  it("is 0 when there is neither a set cost nor any purchase", async () => {
    prismaMock.productPrice.findUnique.mockResolvedValue(null);
    prismaMock.stockPurchase.findFirst.mockResolvedValue(null);

    expect(await getCurrentPurchaseCosts()).toEqual({ QUESO: 0, YOGURT: 0 });
  });
});

describe("getCurrentSalePrices", () => {
  it("reads only the price rows, never the purchase history", async () => {
    prismaMock.productPrice.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(where.product === "QUESO" ? priceRow(12, 9) : null),
    );

    expect(await getCurrentSalePrices()).toEqual({ QUESO: 12, YOGURT: 33 });
    expect(prismaMock.stockPurchase.findFirst).not.toHaveBeenCalled();
  });
});
