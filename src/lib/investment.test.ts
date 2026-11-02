import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, getCurrentStockMock } = vi.hoisted(() => ({
  prismaMock: {
    stockPurchase: { findMany: vi.fn() },
    dailyWorkRecord: { aggregate: vi.fn() },
  },
  getCurrentStockMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/stock", () => ({ getCurrentStock: getCurrentStockMock }));

import { getProductInvestmentSummaries } from "@/lib/investment";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProductInvestmentSummaries", () => {
  it("computes investment, sold, and left for Queso and Yogurt only", async () => {
    prismaMock.stockPurchase.findMany.mockImplementation(({ where }) => {
      if (where.product === "QUESO") {
        return Promise.resolve([
          { quantity: 100, unitCost: 9 },
          { quantity: 50, unitCost: 10 },
        ]);
      }
      return Promise.resolve([{ quantity: 30, unitCost: 33 }]);
    });
    prismaMock.dailyWorkRecord.aggregate.mockResolvedValue({
      _sum: { quesoTaken: 120, quesoRemaining: 12, yogurtTaken: 25, yogurtRemaining: 5 },
    });
    getCurrentStockMock.mockImplementation((product) => Promise.resolve(product === "QUESO" ? 38 : 10));

    const summaries = await getProductInvestmentSummaries();

    expect(summaries).toEqual([
      { product: "QUESO", label: "Queso", investment: 100 * 9 + 50 * 10, sold: 108, left: 38 },
      { product: "YOGURT", label: "Yogurt", investment: 30 * 33, sold: 20, left: 10 },
    ]);
  });

  it("treats a product with no purchases as zero investment", async () => {
    prismaMock.stockPurchase.findMany.mockResolvedValue([]);
    prismaMock.dailyWorkRecord.aggregate.mockResolvedValue({
      _sum: { quesoTaken: 0, quesoRemaining: 0, yogurtTaken: 0, yogurtRemaining: 0 },
    });
    getCurrentStockMock.mockResolvedValue(0);

    const summaries = await getProductInvestmentSummaries();

    expect(summaries.every((s) => s.investment === 0 && s.sold === 0 && s.left === 0)).toBe(true);
  });
});
