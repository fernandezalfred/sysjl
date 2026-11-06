"use client";

import { useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "@/lib/pricing";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { Granularity } from "@/lib/date-buckets";
import type { UserTrend } from "@/lib/sales-charts";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { CHART_COLORS, formatDayLabel, formatMonthLabel } from "@/components/sales-charts/chart-theme";
import { linePointLabels } from "@/components/sales-charts/chart-labels";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const GRANULARITIES: Granularity[] = ["day", "week", "month"];

// The dataviz skill's categorical slots, in fixed order (validated for lines on the
// adjacent pairlist). Users are sorted by name, so each keeps the same color.
const USER_COLORS = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#eb6834", dark: "#d95926" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#008300", dark: "#008300" },
  { light: "#6250d6", dark: "#9085e9" },
  { light: "#e34948", dark: "#e66767" },
];

function periodLabel(period: string, granularity: Granularity, locale: Locale, t: TranslateFn): string {
  if (granularity === "month") return formatMonthLabel(period, locale);
  if (granularity === "week") return t("trend.weekOf", { date: formatDayLabel(period, locale) });
  return formatDayLabel(period, locale);
}

interface UserTrendChartProps {
  trends: Record<Granularity, UserTrend>;
  locale: Locale;
}

// One line per user: Total sold + unsold over time, by day, week, or month.
export function UserTrendChart({ trends, locale }: UserTrendChartProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const mode = useIsDarkMode() ? "dark" : "light";
  const { periods, series } = trends[granularity];

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    // Room around the edge points for their numbers.
    layout: { padding: { left: 24, right: 24 } },
    plugins: {
      legend: { position: "top", labels: { color: CHART_COLORS.ink[mode], font: { size: 12 } } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}` } },
    },
    scales: {
      x: {
        ticks: { color: CHART_COLORS.muted, font: { size: 12 } },
        grid: { display: false },
        border: { color: CHART_COLORS.axis[mode] },
      },
      y: {
        beginAtZero: true,
        // Headroom above the highest point for its amount label.
        grace: "15%",
        ticks: { color: CHART_COLORS.muted, font: { size: 12 } },
        grid: { color: CHART_COLORS.grid[mode] },
        border: { display: false },
      },
    },
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex self-start rounded-lg border border-foreground/15 p-1">
        {GRANULARITIES.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={granularity === g}
            onClick={() => setGranularity(g)}
            className={`rounded-md px-3 py-1 text-sm ${
              granularity === g ? "bg-foreground/10 font-medium text-foreground" : "text-foreground/70"
            }`}
          >
            {t(`trend.${g}`)}
          </button>
        ))}
      </div>

      <div className="h-64">
        <Line
          options={options}
          plugins={[linePointLabels({ ink: CHART_COLORS.ink[mode], surface: CHART_COLORS.surface[mode] })]}
          aria-label={t("salesCharts.trendTitle")}
          data={{
            labels: periods.map((p) => periodLabel(p, granularity, locale, t)),
            datasets: series.map((s, i) => {
              const color = USER_COLORS[i % USER_COLORS.length][mode];
              return {
                label: s.userName,
                data: s.totals,
                borderColor: color,
                backgroundColor: color,
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2,
                tension: 0,
              };
            }),
          }}
        />
      </div>
    </div>
  );
}
