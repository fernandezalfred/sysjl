import { describe, expect, it } from "vitest";
import { planRepeatLastDay, type RepeatablePurchase } from "@/lib/repeat-purchases";

function purchase(createdAt: string, overrides: Partial<RepeatablePurchase> = {}): RepeatablePurchase {
  return { product: "MILK", quantity: 30, unitCost: 7, createdAt: new Date(createdAt), forUserId: "raul", ...overrides };
}

describe("planRepeatLastDay", () => {
  it("returns every purchase from the most recent Bolivia day", () => {
    const evening = purchase("2026-11-06T00:17:00Z", { forUserId: "daniel" });
    const morning = purchase("2026-11-05T14:00:00Z");
    const older = purchase("2026-11-04T14:00:00Z", { quantity: 99 });

    const plan = planRepeatLastDay([older, evening, morning], "2026-11-06");

    expect(plan).toEqual({ ok: true, day: "2026-11-05", purchases: [evening, morning] });
  });

  it("refuses when the latest day is already today", () => {
    const plan = planRepeatLastDay([purchase("2026-11-06T14:00:00Z")], "2026-11-06");
    expect(plan).toEqual({ ok: false, reason: "alreadyToday" });
  });

  it("refuses when there are no purchases", () => {
    expect(planRepeatLastDay([], "2026-11-06")).toEqual({ ok: false, reason: "nothingToCopy" });
  });

  it("skips users who are no longer active, and entries with no user", () => {
    const raul = purchase("2026-11-05T14:00:00Z");
    const carla = purchase("2026-11-05T14:00:00Z", { forUserId: "carla" });
    const nobody = purchase("2026-11-05T14:00:00Z", { forUserId: null });

    const plan = planRepeatLastDay([raul, carla, nobody], "2026-11-06", new Set(["raul"]));

    expect(plan).toEqual({ ok: true, day: "2026-11-05", purchases: [raul] });
  });

  it("refuses when every entry of the last day belongs to an inactive user", () => {
    const plan = planRepeatLastDay([purchase("2026-11-05T14:00:00Z")], "2026-11-06", new Set());
    expect(plan).toEqual({ ok: false, reason: "nothingToCopy" });
  });
});
