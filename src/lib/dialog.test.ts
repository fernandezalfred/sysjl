import { describe, expect, it } from "vitest";
import { isOutsideRect } from "@/lib/dialog";

const rect = { left: 100, right: 300, top: 50, bottom: 250 };

describe("isOutsideRect", () => {
  it("is false for a point inside the dialog, edges included", () => {
    expect(isOutsideRect(rect, 200, 150)).toBe(false);
    expect(isOutsideRect(rect, 100, 50)).toBe(false);
    expect(isOutsideRect(rect, 300, 250)).toBe(false);
  });

  it("is true for a point on any side outside the dialog", () => {
    expect(isOutsideRect(rect, 99, 150)).toBe(true);
    expect(isOutsideRect(rect, 301, 150)).toBe(true);
    expect(isOutsideRect(rect, 200, 49)).toBe(true);
    expect(isOutsideRect(rect, 200, 251)).toBe(true);
  });
});
