import { describe, expect, it } from "vitest";
import { planRepeatLastDay, type RepeatablePurchase } from "@/lib/repeat-purchases";

function purchase(createdAt: string, overrides: Partial<RepeatablePurchase> = {}): RepeatablePurchase {
  return { product: "HABA", quantity: 4, unitCost: 26.25, createdAt: new Date(createdAt), ...overrides };
}

describe("planRepeatLastDay", () => {
  it("returns every purchase from the most recent Bolivia day", () => {
    const evening = purchase("2026-11-06T00:17:00Z", { product: "MAIZ_PELADO" });
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
});
