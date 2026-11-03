import { PRODUCT_LABEL_KEYS } from "@/lib/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { ProductTotal } from "@/types/landing";

interface SummaryCardsProps {
  productTotals: ProductTotal[];
  currentStock: Record<"QUESO" | "YOGURT", number>;
  t: TranslateFn;
}

export function SummaryCards({ productTotals, currentStock, t }: SummaryCardsProps) {
  const unitsLabel = t("summaryCards.units");

  return (
    <section aria-labelledby="totals-heading" className="flex flex-col gap-3">
      <h2 id="totals-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
        {t("summaryCards.totalsSold")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {productTotals.map((p) => (
          <div key={p.product} className="rounded-lg border border-foreground/10 p-4">
            <p className="text-xs text-foreground/60">{t(PRODUCT_LABEL_KEYS[p.product])}</p>
            <p className="mt-1 text-xl font-semibold">
              {p.quantitySold} {unitsLabel}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
        {t("summaryCards.remainingStock")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {productTotals.map((p) => (
          <div key={p.product} className="rounded-lg border border-foreground/10 p-4">
            <p className="text-xs text-foreground/60">{t(PRODUCT_LABEL_KEYS[p.product])}</p>
            <p className="mt-1 text-xl font-semibold">
              {currentStock[p.product]} {unitsLabel}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
