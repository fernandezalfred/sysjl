import { formatCurrency, PRODUCT_LABEL_KEYS } from "@/lib/pricing";
import type { Locale, TranslateFn } from "@/lib/i18n/translations";
import type { ProductInvestmentDetail } from "@/lib/investment";
import { ProductInvestmentCharts } from "@/components/landing/ProductInvestmentCharts";

interface ProductInvestmentSectionProps {
  details: ProductInvestmentDetail[];
  t: TranslateFn;
  locale: Locale;
}

export function ProductInvestmentSection({ details, t, locale }: ProductInvestmentSectionProps) {
  const unitsLabel = t("summaryCards.units");

  return (
    <section aria-labelledby="investment-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="investment-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          {t("investment.heading")}
        </h2>
        <p className="text-sm text-foreground/60">{t("investment.subheading")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {details.map((d) => (
          <div key={d.product} className="rounded-lg border border-foreground/10 p-4">
            <p className="text-xs text-foreground/60">{t(PRODUCT_LABEL_KEYS[d.product])}</p>
            <dl className="mt-1 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-foreground/60">{t("investment.investment")}</dt>
                <dd className="font-semibold">{formatCurrency(d.investment)}</dd>
              </div>
              <div>
                <dt className="text-foreground/60">{t("investment.revenue")}</dt>
                <dd className="font-semibold">{formatCurrency(d.revenue)}</dd>
              </div>
              <div>
                <dt className="text-foreground/60">{t("investment.sold")}</dt>
                <dd className="font-semibold">
                  {d.sold} {unitsLabel}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/60">{t("investment.left")}</dt>
                <dd className="font-semibold">
                  {d.left} {unitsLabel}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <ProductInvestmentCharts details={details} locale={locale} />
    </section>
  );
}
