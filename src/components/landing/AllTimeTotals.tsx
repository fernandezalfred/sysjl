import { formatCurrency } from "@/lib/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";

interface AllTimeTotalsProps {
  totalSales: number;
  totalNetProfit: number;
  t: TranslateFn;
}

// Admin-only: Net profit is cost/financial data.
export function AllTimeTotals({ totalSales, totalNetProfit, t }: AllTimeTotalsProps) {
  return (
    <section aria-labelledby="all-time-totals-heading" className="flex flex-col gap-3">
      <h2
        id="all-time-totals-heading"
        className="text-sm font-medium uppercase tracking-wide text-foreground/60"
      >
        {t("allTimeTotals.heading")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-foreground/20 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/60">{t("allTimeTotals.sales")}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(totalSales)}</p>
        </div>
        <div className="rounded-lg border border-foreground/20 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/60">{t("allTimeTotals.netProfit")}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(totalNetProfit)}</p>
        </div>
      </div>
    </section>
  );
}
