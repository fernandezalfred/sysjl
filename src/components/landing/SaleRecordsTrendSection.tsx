import { formatCurrency } from "@/lib/pricing";
import type { TrendItem } from "@/lib/date-buckets";
import type { Locale, TranslateFn } from "@/lib/i18n/translations";
import { SaleRecordsTrendChart } from "@/components/landing/SaleRecordsTrendChart";

interface SaleRecordsTrendSectionProps {
  items: TrendItem[];
  adjustedRevenueTotal: number;
  t: TranslateFn;
  locale: Locale;
}

export function SaleRecordsTrendSection({ items, adjustedRevenueTotal, t, locale }: SaleRecordsTrendSectionProps) {
  const grandTotal = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <section aria-labelledby="trend-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="trend-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          {t("trend.heading")}
        </h2>
        <p className="text-sm text-foreground/60">{t("trend.subheading")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-foreground/20 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/60">{t("trend.grandTotal")}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(grandTotal)}</p>
        </div>
        <div className="rounded-lg border border-foreground/20 bg-foreground/[0.03] p-4">
          <p className="text-xs text-foreground/60">{t("trend.totalRevenue")}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(adjustedRevenueTotal)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground/80">{t("trend.chartTitle")}</h3>
        <SaleRecordsTrendChart items={items} locale={locale} />
      </div>
    </section>
  );
}
