import { describe, expect, it } from "vitest";
import { buildDailyRecords } from "@/lib/landing-data";
import { buildQuickStats } from "@/lib/quick-stats";
import { milkCostKey, recordAdjustedRevenue, type MilkGrainsDeductions, type UnitCosts } from "@/lib/revenue";
import type { SaleRecord } from "@/types/landing";

const record = (overrides: Partial<SaleRecord>): SaleRecord => ({
  id: "r1",
  workRecordId: "wr1",
  totalSold: 90,
  createdAt: "2026-10-27T10:00:00.000Z",
  date: "2026-10-27",
  userId: "u1",
  userName: "A",
  product: "QUESO",
  unitPrice: 9,
  quantityTaken: 10,
  quantityRemaining: 0,
  ...overrides,
});

const unitCosts: UnitCosts = { QUESO: 6, YOGURT: 22 };
const stock = { QUESO: 120, YOGURT: 40 };

describe("buildQuickStats", () => {
  const rows = buildDailyRecords([
    record({ id: "a", workRecordId: "wa", date: "2026-10-31", userId: "u1", totalSold: 900, quantityTaken: 100 }),
    record({ id: "b", workRecordId: "wb", date: "2026-11-01", userId: "u1", totalSold: 450, quantityTaken: 50 }),
    record({ id: "c", workRecordId: "wc", date: "2026-11-01", userId: "u2", userName: "B", totalSold: 270, quantityTaken: 30 }),
  ]);
  const deductions: MilkGrainsDeductions = {
    milkCostByUserDay: { [milkCostKey("u1", "2026-11-01")]: 210, [milkCostKey("u1", "2026-10-31")]: 210 },
    grainsShareByDate: { "2026-11-01": 100 },
  };
  const netProfit = (id: string) =>
    recordAdjustedRevenue(rows.find((r) => r.workRecordId === id)!, unitCosts, deductions);

  it("sums sales and Net profit for the most recent day with records only", () => {
    const stats = buildQuickStats(rows, unitCosts, deductions, "2026-11", stock);

    expect(stats.lastDay).toBe("2026-11-01");
    expect(stats.lastDaySales).toBe(450 + 270);
    expect(stats.lastDayNetProfit).toBeCloseTo(netProfit("wb") + netProfit("wc"), 5);
  });

  it("sums Net profit across the given month only, using the Sale Records formula", () => {
    expect(buildQuickStats(rows, unitCosts, deductions, "2026-11", stock).monthNetProfit).toBeCloseTo(
      netProfit("wb") + netProfit("wc"),
      5,
    );
    expect(buildQuickStats(rows, unitCosts, deductions, "2026-10", stock).monthNetProfit).toBeCloseTo(
      netProfit("wa"),
      5,
    );
  });

  it("passes deposit stock through and handles no records", () => {
    const stats = buildQuickStats([], unitCosts, deductions, "2026-11", stock);

    expect(stats).toEqual({
      lastDay: null,
      lastDaySales: 0,
      lastDayNetProfit: 0,
      month: "2026-11",
      monthNetProfit: 0,
      stock,
    });
  });
});
