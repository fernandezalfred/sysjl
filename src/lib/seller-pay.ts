// A seller's pay for one day's Sale Record, from its Total venta (Bs).
export const SELLER_BASE_PAY = 150;
export const SELLER_BASE_PAY_THRESHOLD = 2500;
export const SELLER_PAY_STEP_SALES = 100;
export const SELLER_PAY_STEP_AMOUNT = 10;
export const SELLER_BONUS_SALES = 3000;
export const SELLER_BONUS_AMOUNT = 50;

export interface SellerPay {
  // Base pay plus the per-100 increments, before any bonus.
  base: number;
  // SELLER_BONUS_AMOUNT when the day's sales reach SELLER_BONUS_SALES and the seller is the daily winner; otherwise 0.
  bonus: number;
  total: number;
}

// Up to 2500 sales: 150. Above that, +10 for every 100 over 2500, where a remainder
// of 50 or more counts as another 100 (2549 → 150, 2550 → 160, 2650 → 170).
// Sales of 3000 or more and daily winner: +50 bonus.
export function sellerPay(totalSold: number, isDailyWinner: boolean): SellerPay {
  const excess = Math.max(0, totalSold - SELLER_BASE_PAY_THRESHOLD);
  const steps = Math.round(excess / SELLER_PAY_STEP_SALES);
  const base = SELLER_BASE_PAY + steps * SELLER_PAY_STEP_AMOUNT;
  const bonus = isDailyWinner && totalSold >= SELLER_BONUS_SALES ? SELLER_BONUS_AMOUNT : 0;
  return { base, bonus, total: base + bonus };
}
