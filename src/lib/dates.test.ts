import { describe, expect, it } from "vitest";
import { formatBusinessDateKey, moveToBusinessDate } from "@/lib/dates";

describe("formatBusinessDateKey", () => {
  it("returns the Bolivia calendar day, not the UTC one", () => {
    expect(formatBusinessDateKey(new Date("2026-11-06T00:17:39Z"))).toBe("2026-11-05");
  });

  it("rolls over at local midnight (04:00 UTC)", () => {
    expect(formatBusinessDateKey(new Date("2026-11-06T03:59:59Z"))).toBe("2026-11-05");
    expect(formatBusinessDateKey(new Date("2026-11-06T04:00:00Z"))).toBe("2026-11-06");
  });
});

describe("moveToBusinessDate", () => {
  it("moves to another Bolivia day keeping the time of day", () => {
    // 2026-11-05 21:30 in La Paz (UTC-4) is already 2026-11-06 in UTC.
    const original = new Date("2026-11-06T01:30:00Z");
    const moved = moveToBusinessDate(original, "2026-11-02");
    expect(moved.toISOString()).toBe("2026-11-03T01:30:00.000Z");
    expect(formatBusinessDateKey(moved)).toBe("2026-11-02");
  });

  it("lands on the requested Bolivia day", () => {
    const original = new Date("2026-11-06T01:30:00Z");
    expect(formatBusinessDateKey(moveToBusinessDate(original, "2026-10-20"))).toBe("2026-10-20");
  });

  it("returns the same instant for the same day", () => {
    const original = new Date("2026-11-05T14:00:00Z");
    expect(moveToBusinessDate(original, "2026-11-05").getTime()).toBe(original.getTime());
  });
});
