import { describe, expect, it } from "vitest";
import { buildDailyRecords } from "@/lib/landing-data";
import {
  buildAdjustedRevenueTotal,
  milkCostKey,
  recordAdjustedRevenue,
  type MilkGrainsDeductions,
  type UnitCosts,
} from "@/lib/revenue";
import type { SaleRecord } from "@/types/landing";

const record = (overrides: Partial<SaleRecord>): SaleRecord => ({
  id: "r1",
  workRecordId: "wr1",
  totalSold: 8,
  createdAt: "2026-10-27T10:00:00.000Z",
  date: "2026-10-27",
  userId: "u1",
  userName: "Test User",
  product: "QUESO",
  unitPrice: 9,
  quantityTaken: 10,
  quantityRemaining: 2,
  ...overrides,
});

// Queso: sale 9, cost 6, margin 3 per unit. Yogurt: sale 33, cost 22, margin 11 per unit.
const unitCosts: UnitCosts = { QUESO: 6, YOGURT: 22 };

describe("recordAdjustedRevenue", () => {
  it("is each product's per-unit profit margin (sale price minus cost) times quantity sold, plus Milk & Mote revenue in full", () => {
    // Queso sold 150 @ Bs3 margin = 450; Yogurt sold 22 @ Bs11 margin = 242; Milk & Mote = 100.
    // 450 + 242 + 100 = 792.
    const records = [
      record({ id: "r1a", date: "2026-10-30", userId: "raul", userName: "Raul", product: "QUESO", unitPrice: 9, quantityTaken: 150, quantityRemaining: 0, totalSold: 2176 }),
      record({ id: "r1b", date: "2026-10-30", userId: "raul", userName: "Raul", product: "YOGURT", unitPrice: 33, quantityTaken: 22, quantityRemaining: 0, totalSold: 2176 }),
    ];

    const [row] = buildDailyRecords(records);

    expect(recordAdjustedRevenue(row, unitCosts)).toBe(792);
  });

  it("follows the cost passed in, not a fixed constant, since purchase cost can change", () => {
    const records = [
      record({ id: "r2a", date: "2026-10-29", userId: "u1", userName: "A", product: "QUESO", unitPrice: 9, quantityTaken: 10, quantityRemaining: 0, totalSold: 90 }),
      record({ id: "r2b", date: "2026-10-29", userId: "u1", userName: "A", product: "YOGURT", unitPrice: 33, quantityTaken: 0, quantityRemaining: 0, totalSold: 90 }),
    ];

    const [row] = buildDailyRecords(records);

    expect(recordAdjustedRevenue(row, { QUESO: 6, YOGURT: 22 })).toBe(30);
    expect(recordAdjustedRevenue(row, { QUESO: 4, YOGURT: 22 })).toBe(50);
  });
});

describe("recordAdjustedRevenue with Milk/grains deductions", () => {
  it("subtracts the driver's same-day Milk purchase cost and the day's grains cost split across that day's records", () => {
    // Real-data regression: Daniel, 2026-11-01. Queso sold 150 @ margin 3 = 450;
    // Yogurt sold 22 @ margin 11 = 242; totalSold 2930 -> Milk & Mote 2930 - 1350 - 726 = 854.
    // Undeducted earned: 450 + 242 + 854 = 1546.
    // Daniel's Milk purchase that same day: 30 @ unitCost 6 = 180.
    // That day's grains cost (105 + 306.20 = 411.20) split across 2 drivers (Daniel, Raul) = 205.60.
    // 1546 - 180 - 205.60 = 1160.40.
    const records = [
      record({ id: "r1", date: "2026-11-01", userId: "daniel", userName: "Daniel", product: "QUESO", unitPrice: 9, quantityTaken: 150, quantityRemaining: 0, totalSold: 2930 }),
      record({ id: "r2", date: "2026-11-01", userId: "daniel", userName: "Daniel", product: "YOGURT", unitPrice: 33, quantityTaken: 30, quantityRemaining: 8, totalSold: 2930 }),
    ];
    const [row] = buildDailyRecords(records);

    const deductions: MilkGrainsDeductions = {
      milkCostByUserDay: { [milkCostKey("daniel", "2026-11-01")]: 180 },
      grainsShareByDate: { "2026-11-01": 205.6 },
    };

    expect(recordAdjustedRevenue(row, unitCosts, deductions)).toBeCloseTo(1160.4, 5);
  });

  it("ignores the same driver's Milk purchases from other days", () => {
    const records = [
      record({ id: "r1", date: "2026-10-27", userId: "u1", userName: "A", product: "QUESO", unitPrice: 9, quantityTaken: 10, quantityRemaining: 0, totalSold: 90 }),
    ];
    const [row] = buildDailyRecords(records);

    const deductions: MilkGrainsDeductions = {
      milkCostByUserDay: { [milkCostKey("u1", "2026-10-28")]: 180, [milkCostKey("u1", "2026-10-27")]: 210 },
      grainsShareByDate: {},
    };

    expect(recordAdjustedRevenue(row, unitCosts, deductions)).toBe(recordAdjustedRevenue(row, unitCosts) - 210);
  });

  it("deducts nothing for a user/day with no matching purchase", () => {
    const records = [
      record({ id: "r1", date: "2026-10-27", userId: "u1", userName: "A", product: "QUESO", unitPrice: 9, quantityTaken: 10, quantityRemaining: 0, totalSold: 90 }),
    ];
    const [row] = buildDailyRecords(records);

    expect(recordAdjustedRevenue(row, unitCosts, { milkCostByUserDay: {}, grainsShareByDate: {} })).toBe(
      recordAdjustedRevenue(row, unitCosts),
    );
  });
});

describe("buildAdjustedRevenueTotal", () => {
  it("sums across every record, not just one", () => {
    const records = [
      record({ id: "r1", date: "2026-10-30", userId: "u1", userName: "A", product: "QUESO", unitPrice: 9, quantityTaken: 10, quantityRemaining: 0, totalSold: 90 }),
      record({ id: "r2", date: "2026-10-29", userId: "u2", userName: "B", product: "QUESO", unitPrice: 9, quantityTaken: 5, quantityRemaining: 0, totalSold: 45 }),
    ];

    const total = buildAdjustedRevenueTotal(buildDailyRecords(records), unitCosts);

    expect(total).toBe(45);
  });

  it("is zero for no records", () => {
    expect(buildAdjustedRevenueTotal([], unitCosts)).toBe(0);
  });
});
