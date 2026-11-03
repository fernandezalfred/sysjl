import type { Granularity } from "@/lib/date-buckets";
import type { Locale, TranslateFn } from "@/lib/i18n/translations";
import type { UserProductSales, UserSalesPeriod, UserTrend } from "@/lib/sales-charts";
import { UserSalesChart } from "@/components/sales-charts/UserSalesChart";
import { LastDayProductCharts } from "@/components/sales-charts/LastDayProductCharts";
import { UserTrendChart } from "@/components/sales-charts/UserTrendChart";
import { formatDayLabel } from "@/components/sales-charts/chart-theme";

interface SalesChartsSectionProps {
  userSalesByPeriod: Record<Granularity, UserSalesPeriod> | null;
  lastDayProductSales: { date: string; users: UserProductSales[] } | null;
  userTrends: Record<Granularity, UserTrend>;
  t: TranslateFn;
  locale: Locale;
}

// Sales charts visible to every signed-in user (admins and vehicle users alike):
// sales revenue only, no cost or profit data.
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
