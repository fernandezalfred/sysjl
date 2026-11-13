import { bucketKey, type Granularity } from "@/lib/date-buckets";
import { sellerPay } from "@/lib/money/seller-pay";
import { recordAdjustedRevenue, type GrainsDeductions, type UnitCosts } from "@/lib/money/revenue";
import type { DailyRecordRow } from "@/types/daily-records";

export interface ProductIncome {
  queso: number;
  yogurt: number;
  // Leche y Mote: Total venta minus Queso and Yogurt revenue.
  milkMote: number;
  total: number;
}

// Units from the sale records: Queso and Yogurt sold, taken ("Sacó") and left over ("Sobró").
export interface FinanceUnits {
  queso: number;
  yogurt: number;
  quesoTaken: number;
  quesoRemaining: number;
  yogurtTaken: number;
  yogurtRemaining: number;
  milkLiters: number;
}

export interface FinanceCosts {
  // Queso / Yogurt sold × their purchase cost.
  queso: number;
  yogurt: number;
  // Each record's Milk liters × price per liter.
  milk: number;
  // Grain purchases made in the period.
  grains: number;
  total: number;
}

export interface FinanceFigures {
  // Sale records (one per seller per day).
  records: number;
  income: ProductIncome;
  units: FinanceUnits;
  // Value of the Queso and Yogurt left over, at the records' sale prices.
  unsoldValue: number;
  costs: FinanceCosts;
  // income.total − costs.total.
  netProfit: number;
  // Seller pay (Pago), paid or not.
  pay: number;
  // netProfit − pay: what the business keeps.
  result: number;
}

export interface PeriodFinance extends FinanceFigures {
  // Period key from bucketKey: YYYY-MM-DD (day or the week's Monday) or YYYY-MM.
  period: string;
}

function emptyFigures(): FinanceFigures {
  return {
    records: 0,
    income: { queso: 0, yogurt: 0, milkMote: 0, total: 0 },
    units: { queso: 0, yogurt: 0, quesoTaken: 0, quesoRemaining: 0, yogurtTaken: 0, yogurtRemaining: 0, milkLiters: 0 },
    unsoldValue: 0,
    costs: { queso: 0, yogurt: 0, milk: 0, grains: 0, total: 0 },
    netProfit: 0,
    pay: 0,
    result: 0,
  };
}

function finish(f: FinanceFigures): FinanceFigures {
  f.income.total = f.income.queso + f.income.yogurt + f.income.milkMote;
  f.costs.total = f.costs.queso + f.costs.yogurt + f.costs.milk + f.costs.grains;
  f.netProfit = f.income.total - f.costs.total;
  f.result = f.netProfit - f.pay;
  return f;
}

// Income, costs, Neto and pay of every seller's records per day, week or
// month, oldest first. A period appears when it has a sale record or a grain purchase.
// On a day with records, netProfit and result match that day's Neto and
// Neto − Pago (before the per-seller rounding).
export function buildFinanceByPeriod(
  rows: DailyRecordRow[],
  unitCosts: UnitCosts,
  grainsCostByDay: Record<string, number>,
  granularity: Granularity,
): PeriodFinance[] {
  const byPeriod = new Map<string, FinanceFigures>();
  const figuresFor = (date: string) => {
    const key = bucketKey(date, granularity);
    const current = byPeriod.get(key) ?? emptyFigures();
    byPeriod.set(key, current);
    return current;
  };

  for (const r of rows) {
    const f = figuresFor(r.date);
    f.records += 1;
    f.income.queso += r.queso.revenue;
    f.income.yogurt += r.yogurt.revenue;
    f.income.milkMote += r.milkMoteRevenue;
    f.units.queso += r.queso.sold;
    f.units.yogurt += r.yogurt.sold;
    f.units.quesoTaken += r.queso.taken;
    f.units.quesoRemaining += r.queso.remaining;
    f.units.yogurtTaken += r.yogurt.taken;
    f.units.yogurtRemaining += r.yogurt.remaining;
    f.units.milkLiters += r.milkLiters;
    f.unsoldValue += r.queso.remainingValue + r.yogurt.remainingValue;
    f.costs.queso += r.queso.sold * unitCosts.QUESO;
    f.costs.yogurt += r.yogurt.sold * unitCosts.YOGURT;
    f.costs.milk += r.milkLiters * r.milkUnitCost;
    f.pay += sellerPay(r.totalSold);
  }
  for (const [date, cost] of Object.entries(grainsCostByDay)) {
    figuresFor(date).costs.grains += cost;
  }

  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, figures]) => ({ period, ...finish(figures) }));
}

// The sum of every period (totals row, tiles for "all periods").
export function totalFinance(periods: FinanceFigures[]): FinanceFigures {
  const t = emptyFigures();
  for (const p of periods) {
    t.records += p.records;
    t.income.queso += p.income.queso;
    t.income.yogurt += p.income.yogurt;
    t.income.milkMote += p.income.milkMote;
    for (const key of Object.keys(t.units) as (keyof FinanceUnits)[]) t.units[key] += p.units[key];
    t.unsoldValue += p.unsoldValue;
    t.costs.queso += p.costs.queso;
    t.costs.yogurt += p.costs.yogurt;
    t.costs.milk += p.costs.milk;
    t.costs.grains += p.costs.grains;
    t.pay += p.pay;
  }
  return finish(t);
}

export interface SellerFinance {
  userId: string;
  userName: string;
  days: number;
  // Total venta.
  sales: number;
  // Sum of the records' Neto (grains split among that day's sellers).
  netProfit: number;
  pay: number;
  result: number;
}

// Each seller's figures in one period (the key from bucketKey), most sold first.
export function buildSellerFinance(
  rows: DailyRecordRow[],
  unitCosts: UnitCosts,
  deductions: GrainsDeductions,
  granularity: Granularity,
  period: string,
): SellerFinance[] {
  const bySeller = new Map<string, SellerFinance>();
  for (const r of rows) {
    if (bucketKey(r.date, granularity) !== period) continue;
    const s = bySeller.get(r.userId) ?? { userId: r.userId, userName: r.userName, days: 0, sales: 0, netProfit: 0, pay: 0, result: 0 };
    s.days += 1;
    s.sales += r.totalSold;
    s.netProfit += recordAdjustedRevenue(r, unitCosts, deductions);
    s.pay += sellerPay(r.totalSold);
    s.result = s.netProfit - s.pay;
    bySeller.set(r.userId, s);
  }
  return [...bySeller.values()].sort((a, b) => b.sales - a.sales || a.userName.localeCompare(b.userName));
}
