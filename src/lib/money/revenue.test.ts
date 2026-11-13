import { describe, expect, it } from "vitest";
import { buildDailyRecords } from "@/lib/daily-records";
import {
  buildGrainsShareByDate,
  buildNetProfitAfterPayByDate,
  recordAdjustedRevenue,
  recordUnitCost,
  type GrainsDeductions,
  type UnitCosts,
} from "@/lib/money/revenue";
import type { SaleRecord } from "@/types/daily-records";

const record = (overrides: Partial<SaleRecord>): SaleRecord => ({
  id: "r1",
  workRecordId: "wr1",
  payPaid: false,
  totalSold: 8,
  createdAt: "2026-10-27T10:00:00.000Z",
  date: "2026-10-27",
  userId: "u1",
  userName: "Test User",
  product: "QUESO",
  unitPrice: 9,
  quantityTaken: 10,
  quantityRemaining: 2,
  milkLiters: 0,
  milkUnitCost: 0,
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
  it("subtracts the record's own Milk (liters × price) and the day's grains cost split across that day's records", () => {
    // Real-data regression: Daniel, 2026-11-01. Queso sold 150 @ margin 3 = 450;
    // Yogurt sold 22 @ margin 11 = 242; totalSold 2930 -> Milk & Mote 2930 - 1350 - 726 = 854.
    // Undeducted earned: 450 + 242 + 854 = 1546.
    // Daniel's Milk on the record: 30 liters @ Bs 6 = 180.
    // That day's grains cost (105 + 306.20 = 411.20) split across 2 drivers (Daniel, Raul) = 205.60.
    // 1546 - 180 - 205.60 = 1160.40, rounded to 1160.
    const records = [
      record({ id: "r1", date: "2026-11-01", userId: "daniel", userName: "Daniel", product: "QUESO", unitPrice: 9, quantityTaken: 150, quantityRemaining: 0, totalSold: 2930, milkLiters: 30, milkUnitCost: 6 }),
      record({ id: "r2", date: "2026-11-01", userId: "daniel", userName: "Daniel", product: "YOGURT", unitPrice: 33, quantityTaken: 30, quantityRemaining: 8, totalSold: 2930, milkLiters: 30, milkUnitCost: 6 }),
    ];
    const [row] = buildDailyRecords(records);

    const deductions: GrainsDeductions = { grainsShareByDate: { "2026-11-01": 205.6 } };

    expect(recordAdjustedRevenue(row, unitCosts, deductions)).toBe(1160);
  });

  it("deducts the Milk even without grains", () => {
    const [row] = buildDailyRecords([
      record({ product: "QUESO", quantityTaken: 10, quantityRemaining: 0, totalSold: 90, milkLiters: 30, milkUnitCost: 7 }),
    ]);

    expect(recordAdjustedRevenue(row, unitCosts)).toBe(30 - 210);
  });

  it("deducts nothing for a record with 0 liters and a day with no grains", () => {
    const [row] = buildDailyRecords([record({ product: "QUESO", quantityTaken: 10, quantityRemaining: 0, totalSold: 90 })]);

    expect(recordAdjustedRevenue(row, unitCosts, { grainsShareByDate: {} })).toBe(30);
  });
});

describe("buildGrainsShareByDate", () => {
  it("splits each day's grains cost evenly across that day's records, rounded to whole bolivianos", () => {
    const records = [{ date: "2026-11-01" }, { date: "2026-11-01" }, { date: "2026-10-31" }];

    expect(buildGrainsShareByDate({ "2026-11-01": 411.2, "2026-10-31": 300 }, records)).toEqual({
      "2026-11-01": 206,
      "2026-10-31": 300,
    });
  });

  it("re-splits a day's grains when another seller adds a record that day", () => {
    const grains = { "2026-11-09": 128.3 };
    expect(buildGrainsShareByDate(grains, [{ date: "2026-11-09" }])).toEqual({ "2026-11-09": 128 });
    expect(buildGrainsShareByDate(grains, [{ date: "2026-11-09" }, { date: "2026-11-09" }])).toEqual({ "2026-11-09": 64 });
  });

  it("keeps the full cost for a purchase day with no sale records", () => {
    expect(buildGrainsShareByDate({ "2026-10-20": 100 }, [])).toEqual({ "2026-10-20": 100 });
  });
});

describe("buildNetProfitAfterPayByDate", () => {
  it("sums each day's records' Net profit minus seller pay, deducting the day's full grains cost once", () => {
    // Day 1: A sells 10 Queso (margin 3 each = 30), B sells 2 Yogurt (margin 11 each = 22).
    // Grains 40 that day, split 20 + 20; A also has 5 of Milk. 30 + 22 - 40 - 5 = 7,
    // minus Bs 150 pay for each seller (both sold under 2500): 7 - 300 = -293.
    // Day 2: A sells 4 Queso = 12, minus 150 pay = -138.
    const rows = buildDailyRecords([
      record({ id: "r1", date: "2026-11-01", userId: "a", product: "QUESO", quantityTaken: 10, quantityRemaining: 0, totalSold: 90, milkLiters: 1, milkUnitCost: 5 }),
      record({ id: "r2", date: "2026-11-01", userId: "b", product: "YOGURT", unitPrice: 33, quantityTaken: 2, quantityRemaining: 0, totalSold: 66 }),
      record({ id: "r3", date: "2026-11-02", userId: "a", product: "QUESO", quantityTaken: 4, quantityRemaining: 0, totalSold: 36 }),
    ]);
    const deductions: GrainsDeductions = {
      grainsShareByDate: buildGrainsShareByDate({ "2026-11-01": 40 }, rows),
    };

    const byDate = buildNetProfitAfterPayByDate(rows, unitCosts, deductions);

    expect(byDate["2026-11-01"]).toBeCloseTo(-293, 5);
    expect(byDate["2026-11-02"]).toBeCloseTo(-138, 5);
  });

  it("deducts a higher-tier pay for a record with more than 2500 in sales", () => {
    // 300 Queso sold at 9 = 2700 Total venta, margin 3 each = 900; pay for 2700 is 170.
    const rows = buildDailyRecords([
      record({ id: "r1", date: "2026-11-03", product: "QUESO", quantityTaken: 300, quantityRemaining: 0, totalSold: 2700 }),
    ]);

    expect(buildNetProfitAfterPayByDate(rows, unitCosts)["2026-11-03"]).toBeCloseTo(900 - 170, 5);
  });

  it("is empty when there are no records", () => {
    expect(buildNetProfitAfterPayByDate([], unitCosts)).toEqual({});
  });
});

describe("recordUnitCost", () => {
  const unitCosts: UnitCosts = { QUESO: 6, YOGURT: 22 };

  it("uses the cost snapshotted on the record", () => {
    expect(recordUnitCost({ purchaseCosts: { QUESO: 5, YOGURT: 20 } }, "QUESO", unitCosts)).toBe(5);
    expect(recordUnitCost({ purchaseCosts: { QUESO: 0 } }, "QUESO", unitCosts)).toBe(0);
  });

  it("falls back to the current cost for a record without a snapshot", () => {
    expect(recordUnitCost({ purchaseCosts: { QUESO: null, YOGURT: null } }, "YOGURT", unitCosts)).toBe(22);
    expect(recordUnitCost({}, "QUESO", unitCosts)).toBe(6);
  });
});
