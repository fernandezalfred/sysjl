import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { dailyWorkRecord: { findMany: vi.fn() } },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { buildDailyRecords, buildUserTotals, getDailyRecordsData } from "@/lib/daily-records";
import type { SaleRecord } from "@/types/daily-records";

const MOCK_WORK_RECORDS = [
  {
    id: "wr1",
    date: new Date("2026-10-27T00:00:00.000Z"),
    userId: "u1",
    quesoTaken: 80,
    quesoRemaining: 12,
    yogurtTaken: 60,
    yogurtRemaining: 5,
    totalSold: 123,
    quesoSalePrice: 9,
    yogurtSalePrice: 33,
    createdAt: new Date("2026-10-27T08:00:00.000Z"),
    user: { name: "Carla Mamani" },
  },
  {
    id: "wr2",
    date: new Date("2026-10-27T00:00:00.000Z"),
    userId: "u2",
    quesoTaken: 70,
    quesoRemaining: 20,
    yogurtTaken: 50,
    yogurtRemaining: 18,
    totalSold: 82,
    quesoSalePrice: 9,
    yogurtSalePrice: 33,
    createdAt: new Date("2026-10-27T09:00:00.000Z"),
    user: { name: "Jorge Quispe" },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.dailyWorkRecord.findMany.mockResolvedValue(MOCK_WORK_RECORDS);
});

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

describe("buildUserTotals", () => {
  it("builds one row per user per day with Bs revenue for Queso/Yogurt/Milk & Mote and total revenue matching buildDailyRecords", () => {
    const records = [
      record({ id: "r1", date: "2026-10-27", userId: "u1", userName: "Carla", product: "QUESO", unitPrice: 9, quantityTaken: 80, quantityRemaining: 12, totalSold: 3369 }),
      record({ id: "r2", date: "2026-10-27", userId: "u1", userName: "Carla", product: "YOGURT", unitPrice: 33, quantityTaken: 60, quantityRemaining: 5, totalSold: 3369 }),
      record({ id: "r3", date: "2026-10-27", userId: "u2", userName: "Jorge", product: "QUESO", unitPrice: 9, quantityTaken: 4, quantityRemaining: 0, totalSold: 36 }),
      record({ id: "r4", date: "2026-10-27", userId: "u2", userName: "Jorge", product: "YOGURT", unitPrice: 33, quantityTaken: 2, quantityRemaining: 0, totalSold: 36 }),
    ];

    const totals = buildUserTotals(records);
    const dailyRows = buildDailyRecords(records);
    const carla = totals.find((t) => t.userId === "u1")!;
    const jorge = totals.find((t) => t.userId === "u2")!;
    const carlaDaily = dailyRows.find((r) => r.userId === "u1")!;
    const jorgeDaily = dailyRows.find((r) => r.userId === "u2")!;

    expect(carla.quesoRevenue).toBe(68 * 9);
    expect(carla.yogurtRevenue).toBe(55 * 33);
    expect(carla.milkMoteRevenue).toBe(carlaDaily.milkMoteRevenue);
    expect(carla.totalRevenue).toBe(carlaDaily.totalRevenue);
    expect(carla.isDailyWinner).toBe(true);
    expect(carla.winnerMargin).toBe(carlaDaily.winnerMargin);

    expect(jorge.totalRevenue).toBe(jorgeDaily.totalRevenue);
    expect(jorge.isDailyWinner).toBe(false);
    expect(jorge.winnerMargin).toBe(jorgeDaily.winnerMargin);
  });

  it("keeps a user's rows separate per day instead of merging across days", () => {
    const records = [
      record({ id: "r1", date: "2026-10-26", userId: "u1", userName: "Carla", quantityTaken: 10, quantityRemaining: 2 }),
      record({ id: "r2", date: "2026-10-27", userId: "u1", userName: "Carla", quantityTaken: 6, quantityRemaining: 1 }),
    ];

    const totals = buildUserTotals(records);

    expect(totals).toHaveLength(2);
    expect(totals.some((t) => t.date === "2026-10-26")).toBe(true);
    expect(totals.some((t) => t.date === "2026-10-27")).toBe(true);
  });

  it("sorts rows by day descending (most recent first)", () => {
    const records = [
      record({ id: "r1", date: "2026-10-26", userId: "u1", userName: "Carla", quantityTaken: 10, quantityRemaining: 2 }),
      record({ id: "r2", date: "2026-10-27", userId: "u2", userName: "Jorge", quantityTaken: 4, quantityRemaining: 0 }),
    ];

    const totals = buildUserTotals(records);

    expect(totals[0].date).toBe("2026-10-27");
    expect(totals[1].date).toBe("2026-10-26");
  });
});

describe("buildDailyRecords", () => {
  it("merges a user's same-day Queso and Yogurt records into one row with combined revenue", () => {
    const records = [
      record({ id: "r1", date: "2026-10-27", userId: "u1", userName: "Carla", product: "QUESO", unitPrice: 9, quantityTaken: 80, quantityRemaining: 12, totalSold: 3000 }),
      record({ id: "r2", date: "2026-10-27", userId: "u1", userName: "Carla", product: "YOGURT", unitPrice: 33, quantityTaken: 60, quantityRemaining: 5, totalSold: 3000 }),
    ];

    const rows = buildDailyRecords(records);

    expect(rows).toHaveLength(1);
    const [row] = rows;
    expect(row.queso).toEqual({ taken: 80, remaining: 12, sold: 68, revenue: 612, remainingValue: 108 });
    expect(row.yogurt).toEqual({ taken: 60, remaining: 5, sold: 55, revenue: 1815, remainingValue: 165 });
    // Milk + Mote have no dedicated inputs: their revenue is totalSold minus Queso's and Yogurt's own revenue
    expect(row.milkMoteRevenue).toBe(3000 - 612 - 1815); // 573
    // totalRevenue combines sold revenue (incl. Milk + Mote) and leftover (unsold) stock value
    expect(row.totalRevenue).toBe(612 + 108 + 1815 + 165 + 573);
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

  it("marks the row with the highest Total Revenue as the day's winner", () => {
    const records = [
      record({ id: "r1", date: "2026-10-27", userId: "u1", userName: "Carla", quantityRemaining: 0, totalSold: 100 }),
      record({ id: "r2", date: "2026-10-27", userId: "u2", userName: "Jorge", quantityRemaining: 0, totalSold: 50 }),
    ];

    const rows = buildDailyRecords(records);

    expect(rows.find((r) => r.userId === "u1")!.isDailyWinner).toBe(true);
    expect(rows.find((r) => r.userId === "u2")!.isDailyWinner).toBe(false);
    // Winner beat the runner-up by 100 - 50 = 50; carried on every row for that day.
    expect(rows.find((r) => r.userId === "u1")!.winnerMargin).toBe(50);
    expect(rows.find((r) => r.userId === "u2")!.winnerMargin).toBe(50);
  });

  it("shares the win when two rows tie on Total Revenue for the same day", () => {
    const records = [
      record({ id: "r1", date: "2026-10-27", userId: "u1", userName: "Carla", quantityRemaining: 0, totalSold: 100 }),
      record({ id: "r2", date: "2026-10-27", userId: "u2", userName: "Jorge", quantityRemaining: 0, totalSold: 100 }),
    ];

    const rows = buildDailyRecords(records);

    expect(rows.every((r) => r.isDailyWinner)).toBe(true);
    // No lower-ranked competitor to measure a margin against.
    expect(rows.every((r) => r.winnerMargin === null)).toBe(true);
  });

  it("determines the winner independently per day", () => {
    const records = [
      // u1 wins 2026-10-26 with a far lower totalSold than either row on 2026-10-27.
      record({ id: "r0", date: "2026-10-26", userId: "u0", userName: "Low", quantityRemaining: 0, totalSold: 20 }),
      record({ id: "r1", date: "2026-10-26", userId: "u1", userName: "Carla", quantityRemaining: 0, totalSold: 100 }),
      record({ id: "r2", date: "2026-10-27", userId: "u2", userName: "Jorge", quantityRemaining: 0, totalSold: 500 }),
      record({ id: "r3", date: "2026-10-27", userId: "u3", userName: "Ana", quantityRemaining: 0, totalSold: 600 }),
    ];

    const rows = buildDailyRecords(records);

    expect(rows.find((r) => r.userId === "u1")!.isDailyWinner).toBe(true);
    expect(rows.find((r) => r.userId === "u2")!.isDailyWinner).toBe(false);
    expect(rows.find((r) => r.userId === "u3")!.isDailyWinner).toBe(true);
    // u1 beat u0 by 100 - 20 = 80; u3 beat u2 by 600 - 500 = 100.
    expect(rows.find((r) => r.userId === "u1")!.winnerMargin).toBe(80);
    expect(rows.find((r) => r.userId === "u3")!.winnerMargin).toBe(100);
  });

  it("does not mark a winner when a day has only a single record", () => {
    const records = [
      record({ id: "r1", date: "2026-10-26", userId: "u1", userName: "Carla", quantityRemaining: 0, totalSold: 100 }),
    ];

    const rows = buildDailyRecords(records);

    expect(rows[0].isDailyWinner).toBe(false);
    expect(rows[0].winnerMargin).toBeNull();
  });

  it("picks the winner and margin by totalRevenue (sold + unsold stock value), not by totalSold alone", () => {
    // Real 2026-10-28 data: Raul sold less revenue-wise before leftovers (2930) than
    // his totalRevenue once unsold stock is counted (3524); same for Daniel (2825 / 3254).
    const records = [
      record({ id: "r1a", date: "2026-10-28", userId: "raul", userName: "Raul", product: "QUESO", unitPrice: 9, quantityTaken: 150, quantityRemaining: 0, totalSold: 2930 }),
      record({ id: "r1b", date: "2026-10-28", userId: "raul", userName: "Raul", product: "YOGURT", unitPrice: 33, quantityTaken: 30, quantityRemaining: 18, totalSold: 2930 }),
      record({ id: "r2a", date: "2026-10-28", userId: "daniel", userName: "Daniel", product: "QUESO", unitPrice: 9, quantityTaken: 150, quantityRemaining: 0, totalSold: 2825 }),
      record({ id: "r2b", date: "2026-10-28", userId: "daniel", userName: "Daniel", product: "YOGURT", unitPrice: 33, quantityTaken: 30, quantityRemaining: 13, totalSold: 2825 }),
    ];

    const rows = buildDailyRecords(records);
    const raul = rows.find((r) => r.userId === "raul")!;
    const daniel = rows.find((r) => r.userId === "daniel")!;

    expect(raul.totalRevenue).toBe(3524);
    expect(daniel.totalRevenue).toBe(3254);
    expect(raul.isDailyWinner).toBe(true);
    expect(raul.winnerMargin).toBe(270); // 3524 - 3254, not 2930 - 2825 = 105
    expect(daniel.isDailyWinner).toBe(false);
  });

  it("puts the most recently created row first, even if its date is older", () => {
    const records = [
      record({
        id: "r1",
        userId: "u1",
        userName: "Carla",
        date: "2026-10-27",
        createdAt: "2026-10-27T08:00:00.000Z",
      }),
      record({
        id: "r2",
        userId: "u2",
        userName: "Jorge",
        date: "2026-10-20",
        createdAt: "2026-10-27T09:00:00.000Z",
      }),
    ];

    const rows = buildDailyRecords(records);

    expect(rows[0].userId).toBe("u2");
    expect(rows[1].userId).toBe("u1");
  });
});

describe("getDailyRecordsData", () => {
  it("builds one user total per user per day from every work record", async () => {
    const data = await getDailyRecordsData();

    const sumOfUserRevenue = data.userTotals.reduce((sum, u) => sum + u.quesoRevenue + u.yogurtRevenue, 0);
    expect(data.userTotals).toHaveLength(2);
    expect(sumOfUserRevenue).toBe((80 - 12) * 9 + (60 - 5) * 33 + (70 - 20) * 9 + (50 - 18) * 33);
  });

  it("uses each record's own snapshotted sale price, not a hardcoded constant", async () => {
    prismaMock.dailyWorkRecord.findMany.mockResolvedValue([
      { ...MOCK_WORK_RECORDS[0], quesoSalePrice: 15, yogurtSalePrice: 40 },
    ]);

    const data = await getDailyRecordsData();
    const row = data.dailyRecords.find((r) => r.userId === "u1")!;

    expect(row.queso.revenue).toBe((80 - 12) * 15);
    expect(row.yogurt.revenue).toBe((60 - 5) * 40);
  });
});
