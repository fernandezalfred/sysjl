// A seller's pay for one day's Sale Record, from its Total venta (Bs). Display-only:
// it's shown subtracted from Ganancia neta under the seller's name, but no stored or
// other computed figure (day totals, charts) changes because of it.
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

// Ganancia neta minus the seller's pay for the same record, as written under the
// seller's name ("1.368 − 180 = 1.188").
export function netProfitAfterPay(netProfit: number, totalSold: number): number {
  return netProfit - sellerPay(totalSold);
}

export interface PayTotal {
  amount: number;
  days: number;
}

// A seller's pay over every day they worked, paid or not.
export function totalSellerPay(records: { userId: string; totalSold: number }[], userId: string): PayTotal {
  const own = records.filter((r) => r.userId === userId);
  return {
    amount: own.reduce((sum, r) => sum + sellerPay(r.totalSold), 0),
    days: own.length,
  };
}

// A seller's pay still owed: the sum of Pago over their records the admin hasn't
// marked as paid yet.
export function pendingSellerPay(
  records: { userId: string; totalSold: number; payPaid: boolean }[],
  userId: string,
): PayTotal {
  const unpaid = records.filter((r) => r.userId === userId && !r.payPaid);
  return {
    amount: unpaid.reduce((sum, r) => sum + sellerPay(r.totalSold), 0),
    days: unpaid.length,
  };
}

// A seller's pay already collected: the sum of Pago over their records the admin
// marked as paid.
export function paidSellerPay(
  records: { userId: string; totalSold: number; payPaid: boolean }[],
  userId: string,
): PayTotal {
  const paid = records.filter((r) => r.userId === userId && r.payPaid);
  return {
    amount: paid.reduce((sum, r) => sum + sellerPay(r.totalSold), 0),
    days: paid.length,
  };
}

export interface SellerPending extends PayTotal {
  userId: string;
  userName: string;
}

// Every seller with records and what each is still owed (unpaid Pago), most owed first;
// sellers with nothing pending stay in the list with 0, last.
export function pendingPayBySeller(
  records: { userId: string; userName: string; totalSold: number; payPaid: boolean }[],
): SellerPending[] {
  const bySeller = new Map<string, SellerPending>();
  for (const r of records) {
    const entry = bySeller.get(r.userId) ?? { userId: r.userId, userName: r.userName, amount: 0, days: 0 };
    if (!r.payPaid) {
      entry.amount += sellerPay(r.totalSold);
      entry.days += 1;
    }
    bySeller.set(r.userId, entry);
  }
  return [...bySeller.values()].sort((a, b) => b.amount - a.amount || a.userName.localeCompare(b.userName));
}
