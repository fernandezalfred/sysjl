import { describe, expect, it } from "vitest";
import { formatBusinessDateKey, formatShortDate, moveToBusinessDay } from "@/lib/dates";
import { translate } from "@/lib/i18n/translations";

describe("formatBusinessDateKey", () => {
  it("returns the Bolivia calendar day, not the UTC one", () => {
    expect(formatBusinessDateKey(new Date("2026-11-06T00:17:39Z"))).toBe("2026-11-05");
  });

  it("rolls over at local midnight (04:00 UTC)", () => {
    expect(formatBusinessDateKey(new Date("2026-11-06T03:59:59Z"))).toBe("2026-11-05");
    expect(formatBusinessDateKey(new Date("2026-11-06T04:00:00Z"))).toBe("2026-11-06");
  });
});

describe("formatShortDate", () => {
  it("adds the day of the week in the user's language", () => {
    expect(formatShortDate("2026-11-12", (key, vars) => translate("es", key, vars))).toBe("Nov 12, 26 jueves");
    expect(formatShortDate("2026-11-10", (key, vars) => translate("es", key, vars))).toBe("Nov 10, 26 martes");
    expect(formatShortDate("2026-11-15", (key, vars) => translate("en", key, vars))).toBe("Nov 15, 26 Sunday");
  });
});

describe("moveToBusinessDay", () => {
  it("moves to another Bolivia day keeping the local time, also for an evening purchase", () => {
    // 2026-11-05 20:17 in Bolivia (next day in UTC).
    expect(moveToBusinessDay(new Date("2026-11-06T00:17:39Z"), "2026-11-02").toISOString()).toBe("2026-11-03T00:17:39.000Z");
    expect(moveToBusinessDay(new Date("2026-11-06T15:00:00Z"), "2026-11-06").toISOString()).toBe("2026-11-06T15:00:00.000Z");
  });
});
