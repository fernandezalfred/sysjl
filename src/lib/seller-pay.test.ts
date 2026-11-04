import { describe, expect, it } from "vitest";
import { sellerPay } from "@/lib/seller-pay";

describe("sellerPay", () => {
  it("is 150 for sales up to 2500", () => {
    expect(sellerPay(0, false).total).toBe(150);
    expect(sellerPay(1800, false).total).toBe(150);
    expect(sellerPay(2500, false).total).toBe(150);
  });

  it("adds 10 per 100 over 2500, rounding a remainder of 50 or more up", () => {
    expect(sellerPay(2549, false).total).toBe(150);
    expect(sellerPay(2550, false).total).toBe(160);
    expect(sellerPay(2600, false).total).toBe(160);
    expect(sellerPay(2649, false).total).toBe(160);
    expect(sellerPay(2650, false).total).toBe(170);
    expect(sellerPay(2827, false).total).toBe(180);
  });

  it("adds a 50 bonus when sales reach 3000 and the seller is the daily winner", () => {
    expect(sellerPay(3000, true)).toEqual({ base: 200, bonus: 50, total: 250 });
    expect(sellerPay(3524, true)).toEqual({ base: 250, bonus: 50, total: 300 });
  });

  it("gives no bonus to a winner under 3000 or a non-winner at 3000+", () => {
    expect(sellerPay(2999, true)).toEqual({ base: 200, bonus: 0, total: 200 });
    expect(sellerPay(3200, false)).toEqual({ base: 220, bonus: 0, total: 220 });
  });
});
