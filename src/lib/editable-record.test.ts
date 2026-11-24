import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { buildDailyRecords } from "@/lib/daily-records";
import { newRecordDefaultsByUser } from "@/lib/editable-record";
import type { SaleRecord } from "@/types/daily-records";

// One seller's day: a Queso and a Yogurt line of the same work record.
function day(userId: string, date: string, createdAt: string, values: { queso: number; yogurt: number; liters: number; unitCost: number }): SaleRecord[] {
  const base = {
    workRecordId: `${userId}-${date}`,
    totalSold: 500,
    payPaid: false,
    createdAt,
    date,
    userId,
    userName: userId,
    unitPrice: 10,
    quantityRemaining: 0,
    milkLiters: values.liters,
    milkUnitCost: values.unitCost,
  };
  return [
    { ...base, id: `${base.workRecordId}-Q`, product: "QUESO", quantityTaken: values.queso },
    { ...base, id: `${base.workRecordId}-Y`, product: "YOGURT", quantityTaken: values.yogurt },
  ];
}

describe("newRecordDefaultsByUser", () => {
  it("takes each seller's most recently created record", () => {
    const rows = buildDailyRecords([
      ...day("u1", "2026-11-20", "2026-11-20T20:00:00.000Z", { queso: 100, yogurt: 24, liters: 30, unitCost: 7 }),
      ...day("u1", "2026-11-21", "2026-11-21T20:00:00.000Z", { queso: 120, yogurt: 30, liters: 35, unitCost: 7.5 }),
      ...day("u2", "2026-11-21", "2026-11-21T19:00:00.000Z", { queso: 80, yogurt: 20, liters: 25, unitCost: 6 }),
    ]);

    expect(newRecordDefaultsByUser(rows)).toEqual({
      u1: { quesoTaken: 120, yogurtTaken: 30, milkLiters: 35, milkUnitCost: 7.5 },
      u2: { quesoTaken: 80, yogurtTaken: 20, milkLiters: 25, milkUnitCost: 6 },
    });
  });

  it("goes by when the record was created, not by its date", () => {
    // The 2026-11-19 record was entered last (e.g. a forgotten day added later).
    const rows = buildDailyRecords([
      ...day("u1", "2026-11-21", "2026-11-21T20:00:00.000Z", { queso: 120, yogurt: 30, liters: 35, unitCost: 7 }),
      ...day("u1", "2026-11-19", "2026-11-22T09:00:00.000Z", { queso: 90, yogurt: 24, liters: 30, unitCost: 7 }),
    ]);

    expect(newRecordDefaultsByUser(rows).u1.quesoTaken).toBe(90);
  });

  it("has nothing for a seller without records", () => {
    expect(newRecordDefaultsByUser([])).toEqual({});
  });
});
