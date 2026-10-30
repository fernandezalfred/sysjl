import { formatCurrency } from "@/lib/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { ProductTotal } from "@/types/landing";

interface SummaryCardsProps {
  productTotals: ProductTotal[];
  grandTotalQuantitySold: number;
  grandTotalRevenue: number;
  grandTotalRemainingValue: number;
  t: TranslateFn;
}

export function SummaryCards({
  productTotals,
  grandTotalQuantitySold,
  grandTotalRevenue,
  grandTotalRemainingValue,
  t,
}: SummaryCardsProps) {
  const unitsLabel = t("summaryCards.units");

  return (
    <section aria-labelledby="totals-heading" className="flex flex-col gap-3">
      <h2 id="totals-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
        {t("summaryCards.totalsSold")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {productTotals.map((p) => (
          <div key={p.product} className="rounded-lg border border-foreground/10 p-4">
            <p className="text-xs text-foreground/60">{p.label}</p>
            <p className="mt-1 text-xl font-semibold">
              {p.quantitySold} {unitsLabel}
            </p>
            <p className="text-sm text-foreground/70">{formatCurrency(p.revenue)}</p>
          </div>
        ))}
        <div className="rounded-lg border border-foreground/20 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/60">{t("summaryCards.combined")}</p>
          <p className="mt-1 text-xl font-semibold">
            {grandTotalQuantitySold} {unitsLabel}
          </p>
          <p className="text-sm text-foreground/70">{formatCurrency(grandTotalRevenue)}</p>
        </div>
      </div>

      <h2 className="mt-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
        {t("summaryCards.remainingStock")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {productTotals.map((p) => (
          <div key={p.product} className="rounded-lg border border-foreground/10 p-4">
            <p className="text-xs text-foreground/60">{p.label}</p>
            <p className="mt-1 text-xl font-semibold">
              {p.quantityRemaining} {unitsLabel}
            </p>
            <p className="text-sm text-foreground/70">{formatCurrency(p.remainingValue)}</p>
          </div>
        ))}
        <div className="rounded-lg border border-foreground/20 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/60">{t("summaryCards.combinedValue")}</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(grandTotalRemainingValue)}</p>
        </div>
      </div>
    </section>
  );
}
