"use client";

import { useMemo } from "react";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import { buildSalesChartsData } from "@/lib/sales-charts";
import type { DailyRecordRow } from "@/types/daily-records";
import { UserSalesChart } from "@/components/sales-charts/UserSalesChart";
import { LastDayProductCharts } from "@/components/sales-charts/LastDayProductCharts";
import { UserTrendChart } from "@/components/sales-charts/UserTrendChart";
import { formatDayLabel } from "@/components/sales-charts/chart-theme";
import { useSelectedDay } from "@/components/sales-charts/SelectedDayProvider";

interface SalesChartsSectionProps {
  dailyRecords: DailyRecordRow[];
  locale: Locale;
}

// Sales charts shown to everyone, guests included (public landing page and
// /dashboard): sales revenue only, no cost or profit data. The per-period and
// per-product charts show the day picked in the records list below (the latest
// work day until one is picked).
export function SalesChartsSection({ dailyRecords, locale }: SalesChartsSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const { selectedDay } = useSelectedDay();
  const { userSalesByPeriod, lastDayProductSales, userTrends } = useMemo(
    () => buildSalesChartsData(dailyRecords, selectedDay),
    [dailyRecords, selectedDay],
  );

  return (
    <section aria-labelledby="sales-charts-heading" className="flex flex-col gap-6">
      <div>
        <h2 id="sales-charts-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/70">
          {t("salesCharts.heading")}
        </h2>
        <p className="text-sm text-foreground/70">{t("salesCharts.subheading")}</p>
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
        <p className="text-sm text-foreground/70">{t("trend.noData")}</p>
      )}
    </section>
  );
}
