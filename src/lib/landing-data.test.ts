import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { dailyWorkRecord: { findMany: vi.fn() } },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { buildDailyRecords, buildProductTotals, buildUserTotals, getLandingPageData } from "@/lib/landing-data";
import type { SaleRecord } from "@/types/landing";

const MOCK_WORK_RECORDS = [
  {
    id: "wr1",
    date: new Date("2026-10-27T00:00:00.000Z"),
    userId: "u1",
    quesoTaken: 80,
    quesoRemaining: 12,
    yogurtTaken: 60,
    yogurtRemaining: 5,
    user: { name: "Carla Mamani", vehicle: { id: "v1", name: "Vehicle 1" } },
  },
  {
    id: "wr2",
    date: new Date("2026-10-27T00:00:00.000Z"),
    userId: "u2",
    quesoTaken: 70,
    quesoRemaining: 20,
    yogurtTaken: 50,
    yogurtRemaining: 18,
    user: { name: "Jorge Quispe", vehicle: { id: "v2", name: "Vehicle 2" } },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.dailyWorkRecord.findMany.mockResolvedValue(MOCK_WORK_RECORDS);
});

const record = (overrides: Partial<SaleRecord>): SaleRecord => ({
  id: "r1",
  date: "2026-10-27",
  userId: "u1",
  userName: "Test User",
  vehicleId: "v1",
  vehicleName: "Vehicle 1",
  product: "QUESO",
  unitPrice: 9,
  quantityTaken: 10,
  quantityRemaining: 2,
  ...overrides,
});

describe("buildProductTotals", () => {
  it("sums sold quantity, revenue and remaining value per product", () => {
    const records = [
      record({ product: "QUESO", unitPrice: 9, quantityTaken: 10, quantityRemaining: 2 }),
      record({ id: "r2", product: "QUESO", unitPrice: 9, quantityTaken: 5, quantityRemaining: 1 }),
      record({ id: "r3", product: "YOGURT", unitPrice: 33, quantityTaken: 6, quantityRemaining: 1 }),
    ];

    const totals = buildProductTotals(records);
    const queso = totals.find((t) => t.product === "QUESO")!;
    const yogurt = totals.find((t) => t.product === "YOGURT")!;

    expect(queso.quantitySold).toBe(12); // (10-2) + (5-1)
    expect(queso.revenue).toBe(108); // 12 * 9
    expect(queso.quantityRemaining).toBe(3); // 2 + 1
    expect(queso.remainingValue).toBe(27); // 3 * 9

    expect(yogurt.quantitySold).toBe(5); // 6-1
    expect(yogurt.revenue).toBe(165); // 5 * 33
  });

  it("returns zeroed totals for a product with no records", () => {
    const totals = buildProductTotals([record({ product: "QUESO" })]);
    const yogurt = totals.find((t) => t.product === "YOGURT")!;

    expect(yogurt.quantitySold).toBe(0);
    expect(yogurt.revenue).toBe(0);
    expect(yogurt.quantityRemaining).toBe(0);
  });
});

describe("buildUserTotals", () => {
  it("aggregates sold quantity and revenue per user across products", () => {
    const records = [
      record({ userId: "u1", userName: "Carla", product: "QUESO", unitPrice: 9, quantityTaken: 10, quantityRemaining: 2 }),
      record({ id: "r2", userId: "u1", userName: "Carla", product: "YOGURT", unitPrice: 33, quantityTaken: 6, quantityRemaining: 1 }),
      record({ id: "r3", userId: "u2", userName: "Jorge", product: "QUESO", unitPrice: 9, quantityTaken: 4, quantityRemaining: 0 }),
    ];

    const totals = buildUserTotals(records);
    const carla = totals.find((t) => t.userId === "u1")!;
    const jorge = totals.find((t) => t.userId === "u2")!;

    expect(carla.quantitySoldByProduct.QUESO).toBe(8);
    expect(carla.quantitySoldByProduct.YOGURT).toBe(5);
    expect(carla.totalQuantitySold).toBe(13);
    expect(carla.totalRevenue).toBe(8 * 9 + 5 * 33);

    expect(jorge.totalQuantitySold).toBe(4);
    expect(jorge.totalRevenue).toBe(36);
  });

  it("sorts users by revenue descending", () => {
    const records = [
      record({ userId: "low", userName: "Low", quantityTaken: 2, quantityRemaining: 1 }),
      record({ id: "r2", userId: "high", userName: "High", quantityTaken: 10, quantityRemaining: 0 }),
    ];

    const totals = buildUserTotals(records);

    expect(totals[0].userId).toBe("high");
    expect(totals[1].userId).toBe("low");
  });
});

describe("buildDailyRecords", () => {
  it("merges a user's same-day Queso and Yogurt records into one row with combined revenue", () => {
    const records = [
      record({ id: "r1", date: "2026-10-27", userId: "u1", userName: "Carla", product: "QUESO", unitPrice: 9, quantityTaken: 80, quantityRemaining: 12 }),
      record({ id: "r2", date: "2026-10-27", userId: "u1", userName: "Carla", product: "YOGURT", unitPrice: 33, quantityTaken: 60, quantityRemaining: 5 }),
    ];

    const rows = buildDailyRecords(records);

    expect(rows).toHaveLength(1);
    const [row] = rows;
    expect(row.queso).toEqual({ taken: 80, remaining: 12, sold: 68, revenue: 612, remainingValue: 108 });
    expect(row.yogurt).toEqual({ taken: 60, remaining: 5, sold: 55, revenue: 1815, remainingValue: 165 });
    // totalRevenue combines sold revenue and leftover (unsold) stock value for both products
    expect(row.totalRevenue).toBe(612 + 108 + 1815 + 165);
  });

  it("keeps a missing product as a zeroed breakdown instead of merging across users or days", () => {
    const records = [
      record({ id: "r1", date: "2026-10-27", userId: "u1", userName: "Carla", product: "QUESO" }),
      record({ id: "r2", date: "2026-10-26", userId: "u1", userName: "Carla", product: "YOGURT" }),
    ];

    const rows = buildDailyRecords(records);

    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.yogurt.taken === 0 || r.queso.taken === 0)).toBe(true);
  });
});

describe("getLandingPageData", () => {
  it("produces consistent grand totals that match the sum of per-product totals", async () => {
    const data = await getLandingPageData();

    const expectedQuantitySold = data.productTotals.reduce((sum, p) => sum + p.quantitySold, 0);
    const expectedRevenue = data.productTotals.reduce((sum, p) => sum + p.revenue, 0);
    const expectedRemainingQuantity = data.productTotals.reduce((sum, p) => sum + p.quantityRemaining, 0);
    const expectedRemainingValue = data.productTotals.reduce((sum, p) => sum + p.remainingValue, 0);

    expect(data.grandTotalQuantitySold).toBe(expectedQuantitySold);
    expect(data.grandTotalRevenue).toBe(expectedRevenue);
    expect(data.grandTotalRemainingQuantity).toBe(expectedRemainingQuantity);
    expect(data.grandTotalRemainingValue).toBe(expectedRemainingValue);
  });

  it("keeps per-user totals consistent with per-product totals", async () => {
    const data = await getLandingPageData();

    const sumOfUserQuantities = data.userTotals.reduce((sum, u) => sum + u.totalQuantitySold, 0);
    expect(sumOfUserQuantities).toBe(data.grandTotalQuantitySold);
  });
});
