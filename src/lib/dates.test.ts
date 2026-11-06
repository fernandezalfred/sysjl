import { describe, expect, it } from "vitest";
import { formatBusinessDateKey } from "@/lib/dates";

describe("formatBusinessDateKey", () => {
  it("returns the Bolivia calendar day, not the UTC one", () => {
    expect(formatBusinessDateKey(new Date("2026-11-06T00:17:39Z"))).toBe("2026-11-05");
  });

  it("rolls over at local midnight (04:00 UTC)", () => {
    expect(formatBusinessDateKey(new Date("2026-11-06T03:59:59Z"))).toBe("2026-11-05");
    expect(formatBusinessDateKey(new Date("2026-11-06T04:00:00Z"))).toBe("2026-11-06");
  });
});
