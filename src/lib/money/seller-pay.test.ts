import { describe, expect, it } from "vitest";
import { netProfitAfterPay, pendingSellerPay, sellerPay } from "@/lib/money/seller-pay";

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

describe("netProfitAfterPay", () => {
  it("subtracts the seller pay for the record's Total venta from its net profit", () => {
    expect(netProfitAfterPay(1368, 2827)).toBe(1188);
    expect(netProfitAfterPay(1000, 2500)).toBe(850);
  });

  it("can go negative when the pay exceeds the net profit", () => {
    expect(netProfitAfterPay(100, 1800)).toBe(-50);
  });
});

describe("pendingSellerPay", () => {
  const records = [
    { userId: "u1", totalSold: 2000, payPaid: false },
    { userId: "u1", totalSold: 2700, payPaid: false },
    { userId: "u1", totalSold: 3000, payPaid: true },
    { userId: "u2", totalSold: 2000, payPaid: false },
  ];

  it("sums the seller's unpaid days only", () => {
    expect(pendingSellerPay(records, "u1")).toEqual({ amount: 150 + 170, days: 2 });
  });

  it("is zero when every day is paid or there are none", () => {
    expect(pendingSellerPay(records, "u3")).toEqual({ amount: 0, days: 0 });
    expect(pendingSellerPay([{ userId: "u1", totalSold: 2000, payPaid: true }], "u1")).toEqual({ amount: 0, days: 0 });
  });
});
