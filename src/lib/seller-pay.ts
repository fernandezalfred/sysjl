// A seller's pay for one day's Sale Record, from its Total venta (Bs). Display-only:
// it isn't subtracted from any other figure.
export const SELLER_BASE_PAY = 150;
export const SELLER_BASE_PAY_THRESHOLD = 2500;
export const SELLER_HIGH_TIER_THRESHOLD = 3000;
export const SELLER_PAY_STEP_SALES = 100;
export const SELLER_PAY_STEP_AMOUNT = 10;
export const SELLER_HIGH_TIER_STEP_AMOUNT = 20;

// Up to 2500 sales: 150. Each 100 over 2500 adds 10 up to 3000, and 20 past 3000.
// The amount over 2500 is first rounded to the nearest 100, a remainder of 50 or
// more counting as another 100 (2549 → 150, 2550 → 160, 3049 → 200, 3050 → 220).
export function sellerPay(totalSold: number): number {
  const excess = Math.max(0, totalSold - SELLER_BASE_PAY_THRESHOLD);
  const steps = Math.round(excess / SELLER_PAY_STEP_SALES);
  const lowTierMax = (SELLER_HIGH_TIER_THRESHOLD - SELLER_BASE_PAY_THRESHOLD) / SELLER_PAY_STEP_SALES;
  const lowSteps = Math.min(steps, lowTierMax);
  const highSteps = steps - lowSteps;
  return SELLER_BASE_PAY + lowSteps * SELLER_PAY_STEP_AMOUNT + highSteps * SELLER_HIGH_TIER_STEP_AMOUNT;
}
