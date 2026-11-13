import { describe, expect, it } from "vitest";
import { buildDailyRecords } from "@/lib/daily-records";
import {
  buildFinanceByPeriod,
  buildSellerFinance,
  cumulativeFinance,
  grainsTotalByDay,
  totalFinance,
} from "@/lib/money/finance";
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

// One day's grain purchases: Maíz pelado, Maíz con cáscara, Haba (Bs).
const grainDay = (maizPelado: number, maizCascara = 0, haba = 0) => ({ MAIZ_PELADO: maizPelado, MAIZ_CASCARA: maizCascara, HABA: haba });

// Raul 2026-11-09 (real data): Queso 117 sold (1053), Yogurt 17 sold (561), Total venta 2700.
function raulDay(overrides: Partial<SaleRecord> = {}) {
  return [
    record({ id: `q-${overrides.userId ?? "u1"}`, ...overrides }),
    record({ id: `y-${overrides.userId ?? "u1"}`, product: "YOGURT", unitPrice: 33, quantityTaken: 30, quantityRemaining: 13, ...overrides }),
  ];
}
const raul = buildDailyRecords(raulDay());

describe("buildFinanceByPeriod", () => {
  it("splits a day into income per product, units, costs, Neto, pay and result", () => {
    const [day] = buildFinanceByPeriod(raul, unitCosts, { "2026-11-09": grainDay(100, 20, 8) }, "day");

    expect(day).toEqual({
      period: "2026-11-09",
      records: 1,
      income: { queso: 1053, yogurt: 561, milkMote: 1086, total: 2700 },
      units: { queso: 117, yogurt: 17, quesoTaken: 150, quesoRemaining: 33, yogurtTaken: 30, yogurtRemaining: 13, milkLiters: 30 },
      unsoldValue: 33 * 9 + 13 * 33,
      costs: {
        queso: 702,
        yogurt: 374,
        milk: 210,
        grains: 128,
        grainsByProduct: { MAIZ_PELADO: 100, MAIZ_CASCARA: 20, HABA: 8 },
        total: 1414,
      },
      netProfit: 1286,
      pay: 170,
      result: 1116,
    });
  });

  it("matches the day's Neto and Neto − Pago", () => {
    const grains = { "2026-11-09": grainDay(128) };
    const deductions = { grainsShareByDate: buildGrainsShareByDate(grainsTotalByDay(grains), raul) };
    const [day] = buildFinanceByPeriod(raul, unitCosts, grains, "day");

    expect(day.netProfit).toBe(recordAdjustedRevenue(raul[0], unitCosts, deductions));
    expect(day.result).toBe(buildNetProfitAfterPayByDate(raul, unitCosts, deductions)["2026-11-09"]);
  });

  it("groups by week and month, oldest first, counting grain days without sales", () => {
    const rows = buildDailyRecords([
      record({ id: "a", date: "2026-11-02", totalSold: 1000, quantityTaken: 0, quantityRemaining: 0, milkLiters: 0 }),
      record({ id: "b", date: "2026-11-09", totalSold: 2000, quantityTaken: 0, quantityRemaining: 0, milkLiters: 0 }),
    ]);
    const grains = { "2026-10-30": grainDay(30, 0, 20) };

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
    const periods = buildFinanceByPeriod(raul, unitCosts, { "2026-11-08": grainDay(100), "2026-11-09": grainDay(0, 0, 28) }, "day");
    const total = totalFinance(periods);

    expect(total.income.total).toBe(2700);
    expect(total.units).toEqual(periods.find((p) => p.period === "2026-11-09")!.units);
    expect(total.costs.grains).toBe(128);
    expect(total.costs.grainsByProduct).toEqual({ MAIZ_PELADO: 100, MAIZ_CASCARA: 0, HABA: 28 });
    expect(total.result).toBe(periods.reduce((sum, p) => sum + p.result, 0));
  });

  it("uses the purchase cost snapshotted on a record, the current cost only for older records", () => {
    const rows = buildDailyRecords([
      ...raulDay({ purchaseCost: 5 }),
      ...raulDay({ date: "2026-11-10", createdAt: "2026-11-10T20:00:00.000Z" }),
    ]);
    const [snapshotted, older] = buildFinanceByPeriod(rows, unitCosts, {}, "day");

    // Both products snapshotted at 5: Queso 117 × 5, Yogurt 17 × 5.
    expect([snapshotted.costs.queso, snapshotted.costs.yogurt]).toEqual([585, 85]);
    // No snapshot: today's costs (Queso 6, Yogurt 22).
    expect([older.costs.queso, older.costs.yogurt]).toEqual([702, 374]);
  });
});

describe("cumulativeFinance", () => {
  it("keeps adding every period up, from the first one to each period", () => {
    const rows = buildDailyRecords([
      record({ id: "a", date: "2026-11-02", totalSold: 1000, quantityTaken: 0, quantityRemaining: 0, milkLiters: 0 }),
      record({ id: "b", date: "2026-11-09", totalSold: 2000, quantityTaken: 0, quantityRemaining: 0, milkLiters: 0 }),
    ]);
    const periods = buildFinanceByPeriod(rows, unitCosts, { "2026-10-30": grainDay(50) }, "day");
    const running = cumulativeFinance(periods);

    expect(running.map((p) => [p.period, p.income.total, p.costs.total, p.pay, p.result])).toEqual([
      ["2026-10-30", 0, 50, 0, -50],
      ["2026-11-02", 1000, 50, 150, 800],
      ["2026-11-09", 3000, 50, 300, 2650],
    ]);
    expect(running[running.length - 1]).toEqual({ period: "2026-11-09", ...totalFinance(periods) });
    // The input periods are left untouched.
    expect(periods[0].costs.total).toBe(50);
  });
});

describe("grainsTotalByDay", () => {
  it("adds the three grains of each day", () => {
    expect(grainsTotalByDay({ "2026-11-09": grainDay(100, 20, 8) })).toEqual({ "2026-11-09": 128 });
  });
});

describe("buildSellerFinance", () => {
  it("sums each seller's sales, Neto and pay in the period, most sold first", () => {
    const rows = buildDailyRecords([
      ...raulDay(),
      ...raulDay({ userId: "u2", userName: "Daniel", totalSold: 3000 }),
      ...raulDay({ date: "2026-11-01" }),
    ]);
    const deductions = { grainsShareByDate: buildGrainsShareByDate({ "2026-11-09": 128 }, rows) };
    const sinceStart = buildSellerFinance(rows, unitCosts, deductions, "day", null);
    expect(sinceStart.find((s) => s.userId === "u1")?.days).toBe(2);


    const sellers = buildSellerFinance(rows, unitCosts, deductions, "day", "2026-11-09");

    // Each pays half the grains (64). Raul 1624 − 210 − 64 = 1350; Daniel sells 300
    // more of Leche y Mote: 1650. Pay: 170 and 200.
    expect(sellers).toEqual([
      { userId: "u2", userName: "Daniel", days: 1, sales: 3000, netProfit: 1650, pay: 200, result: 1450 },
      { userId: "u1", userName: "Raul", days: 1, sales: 2700, netProfit: 1350, pay: 170, result: 1180 },
    ]);
  });
});
