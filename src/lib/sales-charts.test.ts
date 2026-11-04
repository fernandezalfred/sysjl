import { describe, expect, it } from "vitest";
import { buildDailyRecords } from "@/lib/landing-data";
import {
  buildLastDayProductSales,
  buildSalesChartsData,
  buildUserSalesByPeriod,
  buildUserTrend,
  latestWorkDay,
} from "@/lib/sales-charts";
import type { SaleRecord } from "@/types/landing";

const record = (overrides: Partial<SaleRecord>): SaleRecord => ({
  id: "r1",
  workRecordId: "wr1",
  totalSold: 90,
  createdAt: "2026-10-27T10:00:00.000Z",
  date: "2026-10-27",
  userId: "u1",
  userName: "Daniel",
  product: "QUESO",
  unitPrice: 9,
  quantityTaken: 10,
  quantityRemaining: 0,
  ...overrides,
});

// 2026-10-26 is a Monday; 2026-10-27 and 2026-11-01 (a Sunday) fall in that same week.
const rows = buildDailyRecords([
  record({ id: "a", workRecordId: "wa", date: "2026-10-20", userId: "u1", totalSold: 1000 }),
  record({ id: "b", workRecordId: "wb", date: "2026-10-27", userId: "u1", totalSold: 500 }),
  record({ id: "c", workRecordId: "wc", date: "2026-10-31", userId: "u2", userName: "Raul", totalSold: 700 }),
  record({ id: "d", workRecordId: "wd", date: "2026-11-01", userId: "u1", totalSold: 300, quantityTaken: 20, quantityRemaining: 5 }),
  record({ id: "e", workRecordId: "we", date: "2026-11-01", userId: "u2", userName: "Raul", product: "YOGURT", unitPrice: 33, quantityTaken: 30, quantityRemaining: 10, totalSold: 900 }),
]);

describe("latestWorkDay", () => {
  it("is the most recent record date, or null with no records", () => {
    expect(latestWorkDay(rows)).toBe("2026-11-01");
    expect(latestWorkDay([])).toBeNull();
  });
});

describe("buildUserSalesByPeriod", () => {
  it("day: each user's total and total + unsold on the latest work day, highest first", () => {
    // Raul: 900 + 10 unsold Yogurt × 33 = 1230. Daniel: 300 + 5 unsold Queso × 9 = 345.
    expect(buildUserSalesByPeriod(rows, "day")).toEqual({
      period: "2026-11-01",
      users: [
        { userId: "u2", userName: "Raul", total: 900, totalWithUnsold: 1230 },
        { userId: "u1", userName: "Daniel", total: 300, totalWithUnsold: 345 },
      ],
    });
  });

  it("week: sums the Monday–Sunday week containing the latest work day only", () => {
    expect(buildUserSalesByPeriod(rows, "week")).toEqual({
      period: "2026-10-26",
      users: [
        { userId: "u2", userName: "Raul", total: 1600, totalWithUnsold: 1930 },
        { userId: "u1", userName: "Daniel", total: 800, totalWithUnsold: 845 },
      ],
    });
  });

  it("month: sums the calendar month containing the latest work day only", () => {
    expect(buildUserSalesByPeriod(rows, "month")?.period).toBe("2026-11");
    expect(buildUserSalesByPeriod(rows, "month")?.users.map((u) => u.total)).toEqual([900, 300]);
  });

  it("uses the given day instead of the latest work day", () => {
    expect(buildUserSalesByPeriod(rows, "day", "2026-10-27")).toEqual({
      period: "2026-10-27",
      users: [{ userId: "u1", userName: "Daniel", total: 500, totalWithUnsold: 500 }],
    });
    expect(buildUserSalesByPeriod(rows, "week", "2026-10-20")?.period).toBe("2026-10-19");
    expect(buildUserSalesByPeriod(rows, "month", "2026-10-20")?.users.map((u) => u.total)).toEqual([1500, 700]);
  });

  it("is null with no records", () => {
    expect(buildUserSalesByPeriod([], "day")).toBeNull();
  });
});

describe("buildLastDayProductSales", () => {
  it("gives each user's per-product sold and unsold amounts and totals for the latest work day only", () => {
    const result = buildLastDayProductSales(rows);

    expect(result?.date).toBe("2026-11-01");
    expect(result?.users).toEqual([
      // Daniel: took 20 Queso, 5 left (5 × 9 = 45); 15 sold × 9 = 135; Milk & Mote = 300 - 135 = 165.
      // Total sold + unsold = 300 + 45 = 345.
      {
        userId: "u1",
        userName: "Daniel",
        queso: { sold: 15, revenue: 135, remaining: 5, remainingValue: 45 },
        yogurt: { sold: 0, revenue: 0, remaining: 0, remainingValue: 0 },
        milkMoteRevenue: 165,
        totalSold: 300,
        totalRevenue: 345,
      },
      // Raul: took 30 Yogurt, 10 left (10 × 33 = 330); 20 sold × 33 = 660; Milk & Mote = 900 - 660 = 240.
      // Total sold + unsold = 900 + 330 = 1230.
      {
        userId: "u2",
        userName: "Raul",
        queso: { sold: 0, revenue: 0, remaining: 0, remainingValue: 0 },
        yogurt: { sold: 20, revenue: 660, remaining: 10, remainingValue: 330 },
        milkMoteRevenue: 240,
        totalSold: 900,
        totalRevenue: 1230,
      },
    ]);
  });

  it("uses the given day instead of the latest work day", () => {
    const result = buildLastDayProductSales(rows, "2026-10-31");
    expect(result?.date).toBe("2026-10-31");
    expect(result?.users.map((u) => u.userName)).toEqual(["Raul"]);
  });

  it("is null with no records", () => {
    expect(buildLastDayProductSales([])).toBeNull();
  });
});

describe("buildUserTrend", () => {
  // totalRevenue = totalSold + unsold value: Daniel 11-01 = 300 + 5×9 = 345; Raul 11-01 = 900 + 10×33 = 1230.
  it("day: one point per day per user (Total sold + unsold), 0 where the user has no record", () => {
    expect(buildUserTrend(rows, "day")).toEqual({
      periods: ["2026-10-20", "2026-10-27", "2026-10-31", "2026-11-01"],
      series: [
        { userId: "u1", userName: "Daniel", totals: [1000, 500, 0, 345] },
        { userId: "u2", userName: "Raul", totals: [0, 0, 700, 1230] },
      ],
    });
  });

  it("week and month: sums each user's totals per bucket", () => {
    expect(buildUserTrend(rows, "week")).toEqual({
      periods: ["2026-10-19", "2026-10-26"],
      series: [
        { userId: "u1", userName: "Daniel", totals: [1000, 845] },
        { userId: "u2", userName: "Raul", totals: [0, 1930] },
      ],
    });
    expect(buildUserTrend(rows, "month").periods).toEqual(["2026-10", "2026-11"]);
    expect(buildUserTrend(rows, "month").series.map((s) => s.totals)).toEqual([
      [1500, 345],
      [700, 1230],
    ]);
  });

  it("is empty with no records", () => {
    expect(buildUserTrend([], "day")).toEqual({ periods: [], series: [] });
  });
});

describe("buildSalesChartsData", () => {
  it("bundles the per-period, latest-day and trend data for the charts", () => {
    const data = buildSalesChartsData(rows);
    expect(data.userSalesByPeriod).toEqual({
      day: buildUserSalesByPeriod(rows, "day"),
      week: buildUserSalesByPeriod(rows, "week"),
      month: buildUserSalesByPeriod(rows, "month"),
    });
    expect(data.lastDayProductSales).toEqual(buildLastDayProductSales(rows));
    expect(data.userTrends.week).toEqual(buildUserTrend(rows, "week"));
  });

  it("anchors the period and product data on the selected day", () => {
    const data = buildSalesChartsData(rows, "2026-10-27");
    expect(data.userSalesByPeriod?.day).toEqual(buildUserSalesByPeriod(rows, "day", "2026-10-27"));
    expect(data.lastDayProductSales).toEqual(buildLastDayProductSales(rows, "2026-10-27"));
    expect(data.userTrends.day).toEqual(buildUserTrend(rows, "day"));
  });

  it("has no period or latest-day data with no records", () => {
    const data = buildSalesChartsData([]);
    expect(data.userSalesByPeriod).toBeNull();
    expect(data.lastDayProductSales).toBeNull();
    expect(data.userTrends.day).toEqual({ periods: [], series: [] });
  });
});
