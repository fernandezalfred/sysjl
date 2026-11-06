import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/money/pricing";

// Intl puts a non-breaking space between "Bs" and the number; compare with plain spaces.
const plain = (text: string) => text.replace(/\s/g, " ");

describe("formatCurrency", () => {
  it("shows whole bolivianos with thousands grouping", () => {
    expect(plain(formatCurrency(3556))).toBe("Bs 3.556");
  });

  it("rounds cents to the nearest boliviano", () => {
    expect(plain(formatCurrency(1160.4))).toBe("Bs 1.160");
    expect(plain(formatCurrency(1160.5))).toBe("Bs 1.161");
  });

  it("never shows -0", () => {
    expect(plain(formatCurrency(-0.3))).toBe("Bs 0");
  });

  it("keeps the sign of a real loss", () => {
    expect(plain(formatCurrency(-12.6))).toContain("13");
    expect(plain(formatCurrency(-12.6))).toContain("-");
  });
});
