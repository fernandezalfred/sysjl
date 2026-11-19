import { describe, expect, it } from "vitest";
import { buildDailyRecords } from "@/lib/daily-records";
import { buildEqualDaysComparison, buildNetProfitByPeriod, buildPeriodTotals } from "@/lib/money/seller-comparison";
import { buildNetProfitAfterPayByDate, recordAdjustedRevenue } from "@/lib/money/revenue";
import type { SaleRecord } from "@/types/daily-records";

const unitCosts = { QUESO: 6, YOGURT: 22 };
const noGrains = { grainsShareByDate: {} };

// No Queso, Yogurt or Milk: the record's Neto is its Total venta (all Leche y Mote),
// and up to Bs 2500 the Pago is Bs 150, so Neto − Pago = totalSold − 150.
let nextId = 0;
const sale = (userId: string, date: string, totalSold: number): SaleRecord => ({
  id: `r${++nextId}`,
  workRecordId: `wr${nextId}`,
  payPaid: false,
  totalSold,
  createdAt: `${date}T20:00:00.000Z`,
  date,
  userId,
  userName: userId === "u1" ? "Pepito" : userId === "u2" ? "Juan" : "Ana",
  product: "QUESO",
  unitPrice: 9,
  quantityTaken: 0,
  quantityRemaining: 0,
  milkLiters: 0,
  milkUnitCost: 7,
});

const days = (userId: string, dates: string[], totalSold: number) => dates.map((d) => sale(userId, d, totalSold));

describe("buildEqualDaysComparison", () => {
  it("compares each seller's last N days worked, N being the fewest days anyone worked", () => {
    const rows = buildDailyRecords([
      // Pepito: 8 days; his first 4 were big days, his last 4 were small.
      ...days("u1", ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"], 2000),
      ...days("u1", ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"], 500),
      // Juan: 4 days.
      ...days("u2", ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"], 1000),
    ]);

    const comparison = buildEqualDaysComparison(rows, unitCosts, noGrains, "month", "2026-11");

    expect(comparison.days).toBe(4);
    const lastFour = ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
    expect(comparison.sellers).toEqual([
      { userId: "u2", userName: "Juan", daysWorked: 4, result: 4 * (1000 - 150), byDay: lastFour.map((date) => ({ date, result: 850 })) },
      { userId: "u1", userName: "Pepito", daysWorked: 8, result: 4 * (500 - 150), byDay: lastFour.map((date) => ({ date, result: 350 })) },
    ]);
  });

  it("only looks at the chosen period; null is since the beginning", () => {
    const rows = buildDailyRecords([
      ...days("u1", ["2026-10-30", "2026-11-02", "2026-11-03"], 1000),
      ...days("u2", ["2026-11-03"], 2000),
    ]);

    const week = buildEqualDaysComparison(rows, unitCosts, noGrains, "week", "2026-11-02");
    expect(week.days).toBe(1);
    expect(week.sellers.map((s) => [s.userName, s.daysWorked, s.result])).toEqual([
      ["Juan", 1, 1850],
      ["Pepito", 2, 850],
    ]);

    const october = buildEqualDaysComparison(rows, unitCosts, noGrains, "month", "2026-10");
    expect(october.sellers.map((s) => s.userName)).toEqual(["Pepito"]);

    expect(buildEqualDaysComparison(rows, unitCosts, noGrains, "day", null).sellers.map((s) => s.daysWorked)).toEqual([1, 3]);
  });

  it("matches the Neto − Pago shown in Sale Records, grains and higher pay tiers included", () => {
    const rows = buildDailyRecords([sale("u1", "2026-11-09", 3200), sale("u2", "2026-11-09", 2000)]);
    const deductions = { grainsShareByDate: { "2026-11-09": 64 } };

    const { sellers } = buildEqualDaysComparison(rows, unitCosts, deductions, "day", "2026-11-09");

    expect(sellers.reduce((sum, s) => sum + s.result, 0)).toBe(buildNetProfitAfterPayByDate(rows, unitCosts, deductions)["2026-11-09"]);
  });

  it("is empty when nobody worked in the period", () => {
    expect(buildEqualDaysComparison([], unitCosts, noGrains, "day", "2026-11-09")).toEqual({ days: 0, sellers: [] });
  });
});

describe("buildNetProfitByPeriod", () => {
  it("sums every record's Neto per day, week or month, oldest first", () => {
    const rows = buildDailyRecords([
      sale("u1", "2026-11-03", 1000),
      sale("u2", "2026-11-03", 2000),
      sale("u1", "2026-10-30", 500),
    ]);
    const deductions = { grainsShareByDate: { "2026-11-03": 50 } };

    expect(buildNetProfitByPeriod(rows, unitCosts, deductions, "day")).toEqual([
      { period: "2026-10-30", netProfit: 500 },
      { period: "2026-11-03", netProfit: 2900 },
    ]);
    expect(buildNetProfitByPeriod(rows, unitCosts, deductions, "week").map((p) => p.period)).toEqual(["2026-10-26", "2026-11-02"]);
    expect(buildNetProfitByPeriod(rows, unitCosts, deductions, "month")).toEqual([
      { period: "2026-10", netProfit: 500 },
      { period: "2026-11", netProfit: 2900 },
    ]);
    expect(buildNetProfitByPeriod(rows, unitCosts, deductions, "day")[1].netProfit).toBe(
      rows.filter((r) => r.date === "2026-11-03").reduce((sum, r) => sum + recordAdjustedRevenue(r, unitCosts, deductions), 0),
    );
  });
});

describe("buildPeriodTotals", () => {
  it("adds up every seller's pay and Neto − Pago in the period, each day's pay by its own tier", () => {
    const rows = buildDailyRecords([
      sale("u1", "2026-11-03", 3200),
      sale("u2", "2026-11-03", 2000),
      sale("u1", "2026-11-04", 1000),
      sale("u1", "2026-10-30", 500),
    ]);
    const deductions = { grainsShareByDate: { "2026-11-03": 64 } };

    // Pago: 3200 → 150 + 5 × 10 + 2 × 20 = 240; 2000 and 1000 → 150 each.
    expect(buildPeriodTotals(rows, unitCosts, deductions, "month", "2026-11")).toEqual({
      records: 3,
      pay: 240 + 150 + 150,
      result: 3200 - 64 - 240 + (2000 - 64 - 150) + (1000 - 150),
      bySeller: [
        { userId: "u1", userName: "Pepito", pay: 240 + 150, result: 3200 - 64 - 240 + (1000 - 150), days: 2 },
        { userId: "u2", userName: "Juan", pay: 150, result: 2000 - 64 - 150, days: 1 },
      ],
    });
    expect(buildPeriodTotals(rows, unitCosts, deductions, "day", "2026-11-03").result).toBe(
      buildNetProfitAfterPayByDate(rows, unitCosts, deductions)["2026-11-03"],
    );
    expect(buildPeriodTotals(rows, unitCosts, deductions, "day", null).records).toBe(4);
    expect(buildPeriodTotals(rows, unitCosts, deductions, "week", "2026-11-09")).toEqual({ records: 0, pay: 0, result: 0, bySeller: [] });
  });
});

