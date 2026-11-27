import { describe, expect, it } from "vitest";
import { formatAmount, formatCurrency } from "@/lib/money/pricing";

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

describe("formatAmount", () => {
  it("formats whole bolivianos without the currency", () => {
    expect(formatAmount(3556.4)).toBe("3.556");
    expect(formatAmount(-0.2)).toBe("0");
  });
});
