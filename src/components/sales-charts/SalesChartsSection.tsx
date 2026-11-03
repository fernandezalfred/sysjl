import type { Locale, TranslateFn } from "@/lib/i18n/translations";
import type { SalesChartsData } from "@/lib/sales-charts";
import { UserSalesChart } from "@/components/sales-charts/UserSalesChart";
import { LastDayProductCharts } from "@/components/sales-charts/LastDayProductCharts";
import { UserTrendChart } from "@/components/sales-charts/UserTrendChart";
import { formatDayLabel } from "@/components/sales-charts/chart-theme";

interface SalesChartsSectionProps extends SalesChartsData {
  t: TranslateFn;
  locale: Locale;
}

// Sales charts shown to everyone, guests included (public landing page and
// /dashboard): sales revenue only, no cost or profit data.
export function SalesChartsSection({ userSalesByPeriod, lastDayProductSales, userTrends, t, locale }: SalesChartsSectionProps) {
  return (
    <section aria-labelledby="sales-charts-heading" className="flex flex-col gap-6">
      <div>
        <h2 id="sales-charts-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          {t("salesCharts.heading")}
        </h2>
        <p className="text-sm text-foreground/60">{t("salesCharts.subheading")}</p>
      </div>

      {userSalesByPeriod && lastDayProductSales ? (
        <>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground/80">{t("salesCharts.byUserTitle")}</h3>
            <UserSalesChart periods={userSalesByPeriod} locale={locale} />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground/80">
              {t("salesCharts.productsTitle", { date: formatDayLabel(lastDayProductSales.date, locale) })}
            </h3>
            <LastDayProductCharts users={lastDayProductSales.users} locale={locale} />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground/80">{t("salesCharts.trendTitle")}</h3>
            <UserTrendChart trends={userTrends} locale={locale} />
          </div>
        </>
      ) : (
        <p className="text-sm text-foreground/60">{t("trend.noData")}</p>
      )}
    </section>
  );
}
