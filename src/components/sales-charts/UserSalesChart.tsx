"use client";

import { useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "@/lib/pricing";
import { translate, type Locale } from "@/lib/i18n/translations";
import type { Granularity } from "@/lib/date-buckets";
import type { UserSalesPeriod } from "@/lib/sales-charts";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { CHART_COLORS, chartHeightClass, formatDayLabel, formatMonthLabel } from "@/components/sales-charts/chart-theme";
import { horizontalBarLabels } from "@/components/sales-charts/chart-labels";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const GRANULARITIES: Granularity[] = ["day", "week", "month"];

interface UserSalesChartProps {
  periods: Record<Granularity, UserSalesPeriod>;
  locale: Locale;
}

// Two bars per user — Total venta and Total sold + unsold (Bs) — in the latest work
// day, its week, or its month. Each bar has the user's name and its amount written
// inside it; the legend names the two colors.
export function UserSalesChart({ periods, locale }: UserSalesChartProps) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const mode = useIsDarkMode() ? "dark" : "light";
  const { period, users } = periods[granularity];

  const periodLabel =
    granularity === "month"
      ? formatMonthLabel(period, locale)
      : granularity === "week"
        ? t("trend.weekOf", { date: formatDayLabel(period, locale) })
        : formatDayLabel(period, locale);

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: CHART_COLORS.ink[mode], font: { size: 12 } } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.x ?? 0)}` } },
    },
    scales: {
      x: {
        beginAtZero: true,
        // Headroom past the longest bar in case its number goes outside it.
        grace: "15%",
        ticks: { color: CHART_COLORS.muted, font: { size: 12 } },
        grid: { color: CHART_COLORS.grid[mode] },
        border: { display: false },
      },
      y: {
        // User names are written inside the bars instead.
        ticks: { display: false },
        grid: { display: false },
        border: { color: CHART_COLORS.axis[mode] },
      },
    },
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-foreground/15 p-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={granularity === g}
              onClick={() => setGranularity(g)}
              className={`rounded-md px-3 py-1 text-sm ${
                granularity === g ? "bg-foreground/10 font-medium text-foreground" : "text-foreground/60"
              }`}
            >
              {t(`trend.${g}`)}
            </button>
          ))}
        </div>
        <p className="text-sm text-foreground/60">{periodLabel}</p>
      </div>

      <div className={chartHeightClass(users.length * 2)}>
        <Bar
          options={options}
          plugins={[horizontalBarLabels({ ink: CHART_COLORS.ink[mode], surface: CHART_COLORS.surface[mode] })]}
          aria-label={t("salesCharts.byUserTitle")}
          data={{
            labels: users.map((u) => u.userName),
            datasets: [
              {
                label: t("cell.sold"),
                data: users.map((u) => u.total),
                backgroundColor: CHART_COLORS.userSales[mode],
                borderRadius: 4,
                maxBarThickness: 24,
              },
              {
                label: t("cell.soldPlusUnsold"),
                data: users.map((u) => u.totalWithUnsold),
                backgroundColor: CHART_COLORS.userSalesWithUnsold[mode],
                borderRadius: 4,
                maxBarThickness: 24,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
