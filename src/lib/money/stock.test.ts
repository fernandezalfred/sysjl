import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    stockPurchase: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { getGrainsCostByDay, getGrainsCostByDayAndProduct } from "@/lib/money/stock";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getGrainsCostByDay", () => {
  it("sums grain cost per Bolivia day, keeping an evening purchase on its local day", async () => {
    prismaMock.stockPurchase.findMany.mockResolvedValue([
      { product: "MAIZ_PELADO", quantity: 4, unitCost: 26.25, createdAt: new Date("2026-11-06T00:16:41Z") },
      { product: "HABA", quantity: 10, unitCost: 30, createdAt: new Date("2026-11-06T00:17:03Z") },
      { product: "MAIZ_CASCARA", quantity: 2, unitCost: 10, createdAt: new Date("2026-11-06T15:00:00Z") },
    ]);

    expect(await getGrainsCostByDay()).toEqual({ "2026-11-05": 405, "2026-11-06": 20 });
  });
});

describe("getGrainsCostByDayAndProduct", () => {
  it("keeps each grain's cost apart within the day", async () => {
    prismaMock.stockPurchase.findMany.mockResolvedValue([
      { product: "MAIZ_PELADO", quantity: 4, unitCost: 25, createdAt: new Date("2026-11-06T15:00:00Z") },
      { product: "MAIZ_PELADO", quantity: 1, unitCost: 25, createdAt: new Date("2026-11-06T16:00:00Z") },
      { product: "HABA", quantity: 2, unitCost: 30, createdAt: new Date("2026-11-06T17:00:00Z") },
    ]);

    expect(await getGrainsCostByDayAndProduct()).toEqual({
      "2026-11-06": { MAIZ_PELADO: 125, MAIZ_CASCARA: 0, HABA: 60 },
    });
  });
});
