import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    stockPurchase: { aggregate: vi.fn(), findMany: vi.fn() },
    dailyWorkRecord: { aggregate: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { getCurrentStock, getMilkCostByUserAndDay } from "@/lib/stock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentStock", () => {
  it("is total purchased minus total sold (taken - remaining) for the given product", async () => {
    prismaMock.stockPurchase.aggregate.mockResolvedValue({ _sum: { quantity: 200 } });
    prismaMock.dailyWorkRecord.aggregate.mockResolvedValue({
      _sum: { quesoTaken: 120, quesoRemaining: 12, yogurtTaken: 90, yogurtRemaining: 15 },
    });

    const stock = await getCurrentStock("QUESO");

    // sold = 120-12 = 108; stock = 200 - 108 = 92
    expect(stock).toBe(92);
    expect(prismaMock.stockPurchase.aggregate).toHaveBeenCalledWith({
      where: { product: "QUESO" },
      _sum: { quantity: true },
    });
    expect(prismaMock.dailyWorkRecord.aggregate).toHaveBeenCalledWith({
      _sum: {
        quesoTaken: true,
        quesoRemaining: true,
        yogurtTaken: true,
        yogurtRemaining: true,
      },
    });
  });

  it("computes independently per product", async () => {
    prismaMock.stockPurchase.aggregate.mockResolvedValue({ _sum: { quantity: 100 } });
    prismaMock.dailyWorkRecord.aggregate.mockResolvedValue({
      _sum: { quesoTaken: 80, quesoRemaining: 12, yogurtTaken: 60, yogurtRemaining: 5 },
    });

    const stock = await getCurrentStock("YOGURT");

    // sold = 60-5 = 55; stock = 100 - 55 = 45
    expect(stock).toBe(45);
  });

  it("returns the negative of total sold when no stock has ever been purchased", async () => {
    prismaMock.stockPurchase.aggregate.mockResolvedValue({ _sum: { quantity: null } });
    prismaMock.dailyWorkRecord.aggregate.mockResolvedValue({
      _sum: { quesoTaken: 10, quesoRemaining: 2, yogurtTaken: 0, yogurtRemaining: 0 },
    });

    const stock = await getCurrentStock("QUESO");

    expect(stock).toBe(-8);
  });

  it("treats missing sums (no records at all) as zero", async () => {
    prismaMock.stockPurchase.aggregate.mockResolvedValue({ _sum: { quantity: null } });
    prismaMock.dailyWorkRecord.aggregate.mockResolvedValue({
      _sum: { quesoTaken: null, quesoRemaining: null, yogurtTaken: null, yogurtRemaining: null },
    });

    const stock = await getCurrentStock("QUESO");

    expect(stock).toBe(0);
  });

  it("is purchases only for a product with no taken/remaining tracking (e.g. Milk), never deducting sales", async () => {
    prismaMock.stockPurchase.aggregate.mockResolvedValue({ _sum: { quantity: 150 } });

    const stock = await getCurrentStock("MILK");

    expect(stock).toBe(150);
    expect(prismaMock.dailyWorkRecord.aggregate).not.toHaveBeenCalled();
  });

  it("is zero for an unpurchased product with no sales tracking", async () => {
    prismaMock.stockPurchase.aggregate.mockResolvedValue({ _sum: { quantity: null } });

    const stock = await getCurrentStock("MILK");

    expect(stock).toBe(0);
  });
});

describe("getMilkCostByUserAndDay", () => {
  it("sums each driver's Milk cost per local day, keyed by driver and day", async () => {
    prismaMock.stockPurchase.findMany.mockResolvedValue([
      { quantity: 30, unitCost: 6, createdAt: new Date(2026, 9, 27, 14), forUserId: "daniel" },
      { quantity: 30, unitCost: 7, createdAt: new Date(2026, 9, 27, 14), forUserId: "raul" },
      { quantity: 10, unitCost: 6, createdAt: new Date(2026, 9, 27, 18), forUserId: "daniel" },
      { quantity: 30, unitCost: 8, createdAt: new Date(2026, 9, 28, 14), forUserId: "daniel" },
    ]);

    expect(await getMilkCostByUserAndDay()).toEqual({
      "daniel|2026-10-27": 240,
      "raul|2026-10-27": 210,
      "daniel|2026-10-28": 240,
    });
    expect(prismaMock.stockPurchase.findMany).toHaveBeenCalledWith({
      where: { product: "MILK", forUserId: { not: null } },
      select: { quantity: true, unitCost: true, createdAt: true, forUserId: true },
    });
  });
});
