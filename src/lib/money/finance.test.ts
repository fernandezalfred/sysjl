import { describe, expect, it } from "vitest";
import { buildDailyRecords } from "@/lib/daily-records";
import { buildFinanceByPeriod, buildSellerFinance, totalFinance } from "@/lib/money/finance";
import { buildGrainsShareByDate, buildNetProfitAfterPayByDate, recordAdjustedRevenue } from "@/lib/money/revenue";
import type { SaleRecord } from "@/types/daily-records";

const record = (overrides: Partial<SaleRecord>): SaleRecord => ({
  id: "r1",
  workRecordId: "wr1",
  payPaid: false,
  totalSold: 2700,
  createdAt: "2026-11-09T20:00:00.000Z",
  date: "2026-11-09",
  userId: "u1",
  userName: "Raul",
  product: "QUESO",
  unitPrice: 9,
  quantityTaken: 150,
  quantityRemaining: 33,
  milkLiters: 30,
  milkUnitCost: 7,
  ...overrides,
});

const unitCosts = { QUESO: 6, YOGURT: 22 };

// Raul 2026-11-09 (real data): Queso 117 sold (1053), Yogurt 17 sold (561), Total venta 2700.
function raulDay(overrides: Partial<SaleRecord> = {}) {
  return [
    record({ id: `q-${overrides.userId ?? "u1"}`, ...overrides }),
    record({ id: `y-${overrides.userId ?? "u1"}`, product: "YOGURT", unitPrice: 33, quantityTaken: 30, quantityRemaining: 13, ...overrides }),
  ];
}
const raul = buildDailyRecords(raulDay());

describe("buildFinanceByPeriod", () => {
  it("splits a day into income per product, units, costs, Ganancia neta, pay and result", () => {
    const [day] = buildFinanceByPeriod(raul, unitCosts, { "2026-11-09": 128 }, "day");

    expect(day).toEqual({
      period: "2026-11-09",
      records: 1,
      income: { queso: 1053, yogurt: 561, milkMote: 1086, total: 2700 },
      units: { queso: 117, yogurt: 17, quesoTaken: 150, quesoRemaining: 33, yogurtTaken: 30, yogurtRemaining: 13, milkLiters: 30 },
      unsoldValue: 33 * 9 + 13 * 33,
      costs: { queso: 702, yogurt: 374, milk: 210, grains: 128, total: 1414 },
      netProfit: 1286,
      pay: 170,
      result: 1116,
    });
  });

  it("matches the day's Ganancia neta and Ganancia neta − Pago", () => {
    const grains = { "2026-11-09": 128 };
    const deductions = { grainsShareByDate: buildGrainsShareByDate(grains, raul) };
    const [day] = buildFinanceByPeriod(raul, unitCosts, grains, "day");

    expect(day.netProfit).toBe(recordAdjustedRevenue(raul[0], unitCosts, deductions));
    expect(day.result).toBe(buildNetProfitAfterPayByDate(raul, unitCosts, deductions)["2026-11-09"]);
  });

  it("groups by week and month, oldest first, counting grain days without sales", () => {
    const rows = buildDailyRecords([
      record({ id: "a", date: "2026-11-02", totalSold: 1000, quantityTaken: 0, quantityRemaining: 0, milkLiters: 0 }),
      record({ id: "b", date: "2026-11-09", totalSold: 2000, quantityTaken: 0, quantityRemaining: 0, milkLiters: 0 }),
    ]);
    const grains = { "2026-10-30": 50 };

    const weeks = buildFinanceByPeriod(rows, unitCosts, grains, "week");
    expect(weeks.map((w) => [w.period, w.income.total, w.costs.grains, w.result])).toEqual([
      ["2026-10-26", 0, 50, -50],
      ["2026-11-02", 1000, 0, 1000 - 150],
      ["2026-11-09", 2000, 0, 2000 - 150],
    ]);

    const months = buildFinanceByPeriod(rows, unitCosts, grains, "month");
    expect(months.map((m) => [m.period, m.income.total, m.pay, m.records])).toEqual([
      ["2026-10", 0, 0, 0],
      ["2026-11", 3000, 300, 2],
    ]);
  });

  it("totals every period", () => {
    const periods = buildFinanceByPeriod(raul, unitCosts, { "2026-11-08": 100, "2026-11-09": 28 }, "day");
    const total = totalFinance(periods);

    expect(total.income.total).toBe(2700);
    expect(total.units).toEqual(periods.find((p) => p.period === "2026-11-09")!.units);
    expect(total.costs.grains).toBe(128);
    expect(total.result).toBe(periods.reduce((sum, p) => sum + p.result, 0));
  });
});

describe("buildSellerFinance", () => {
  it("sums each seller's sales, Ganancia neta and pay in the period, most sold first", () => {
    const rows = buildDailyRecords([
      ...raulDay(),
      ...raulDay({ userId: "u2", userName: "Daniel", totalSold: 3000 }),
      ...raulDay({ date: "2026-11-01" }),
    ]);
    const deductions = { grainsShareByDate: buildGrainsShareByDate({ "2026-11-09": 128 }, rows) };

    const sellers = buildSellerFinance(rows, unitCosts, deductions, "day", "2026-11-09");

    // Each pays half the grains (64). Raul 1624 − 210 − 64 = 1350; Daniel sells 300
    // more of Leche y Mote: 1650. Pay: 170 and 200.
    expect(sellers).toEqual([
      { userId: "u2", userName: "Daniel", days: 1, sales: 3000, netProfit: 1650, pay: 200, result: 1450 },
      { userId: "u1", userName: "Raul", days: 1, sales: 2700, netProfit: 1350, pay: 170, result: 1180 },
    ]);
  });
});
