import { describe, expect, it } from "vitest";
import { sellerPay } from "@/lib/seller-pay";

describe("sellerPay", () => {
  it("is 150 for sales up to 2500", () => {
    expect(sellerPay(0)).toBe(150);
    expect(sellerPay(1800)).toBe(150);
    expect(sellerPay(2500)).toBe(150);
  });

  it("adds 10 per 100 from 2500 to 3000, rounding a remainder of 50 or more up", () => {
    expect(sellerPay(2549)).toBe(150);
    expect(sellerPay(2550)).toBe(160);
    expect(sellerPay(2649)).toBe(160);
    expect(sellerPay(2650)).toBe(170);
    expect(sellerPay(2827)).toBe(180);
    expect(sellerPay(3000)).toBe(200);
  });

  it("adds 20 per 100 past 3000", () => {
    expect(sellerPay(3049)).toBe(200);
    expect(sellerPay(3050)).toBe(220);
    expect(sellerPay(3100)).toBe(220);
    expect(sellerPay(3200)).toBe(240);
    expect(sellerPay(3524)).toBe(300);
  });
});
