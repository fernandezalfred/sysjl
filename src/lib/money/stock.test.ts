import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    stockPurchase: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { getGrainsCostByDay, getMilkCostByUserAndDay } from "@/lib/money/stock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMilkCostByUserAndDay", () => {
  it("sums each driver's Milk cost per business (Bolivia) day, keyed by driver and day", async () => {
    prismaMock.stockPurchase.findMany.mockResolvedValue([
      { quantity: 30, unitCost: 6, createdAt: new Date("2026-10-27T18:00:00Z"), forUserId: "daniel" },
      { quantity: 30, unitCost: 7, createdAt: new Date("2026-10-27T18:00:00Z"), forUserId: "raul" },
      { quantity: 10, unitCost: 6, createdAt: new Date("2026-10-27T22:00:00Z"), forUserId: "daniel" },
      { quantity: 30, unitCost: 8, createdAt: new Date("2026-10-28T18:00:00Z"), forUserId: "daniel" },
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

  it("keeps an evening purchase on its Bolivia day even when UTC is already the next day", async () => {
    prismaMock.stockPurchase.findMany.mockResolvedValue([
      { quantity: 30, unitCost: 7, createdAt: new Date("2026-11-06T00:17:39Z"), forUserId: "raul" },
    ]);

    expect(await getMilkCostByUserAndDay()).toEqual({ "raul|2026-11-05": 210 });
  });
});

describe("getGrainsCostByDay", () => {
  it("sums grain cost per Bolivia day, keeping an evening purchase on its local day", async () => {
    prismaMock.stockPurchase.findMany.mockResolvedValue([
      { quantity: 4, unitCost: 26.25, createdAt: new Date("2026-11-06T00:16:41Z") },
      { quantity: 10, unitCost: 30, createdAt: new Date("2026-11-06T00:17:03Z") },
      { quantity: 2, unitCost: 10, createdAt: new Date("2026-11-06T15:00:00Z") },
    ]);

    expect(await getGrainsCostByDay()).toEqual({ "2026-11-05": 405, "2026-11-06": 20 });
  });
});
