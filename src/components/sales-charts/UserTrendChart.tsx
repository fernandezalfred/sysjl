"use client";

import { useEffect, useRef, useState } from "react";
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
import { formatCurrency } from "@/lib/money/pricing";
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

// On every screen the chart gets at least ~4rem per period (day/week/month) so points
// and their amount labels don't pile up; when that's wider than the container, the frame
// scrolls sideways. A wider container just stretches the chart, as before.
// Full class strings (not built from numbers) so Tailwind generates them.
const CHART_MIN_WIDTHS: { maxPeriods: number; className: string }[] = [
  { maxPeriods: 5, className: "" },
  { maxPeriods: 8, className: "min-w-[32rem]" },
  { maxPeriods: 12, className: "min-w-[48rem]" },
  { maxPeriods: 16, className: "min-w-[64rem]" },
  { maxPeriods: 20, className: "min-w-[80rem]" },
  { maxPeriods: 24, className: "min-w-[96rem]" },
];
const CHART_MIN_WIDTH_MAX = "min-w-[128rem]";

function chartMinWidthClass(periodCount: number): string {
  return CHART_MIN_WIDTHS.find((w) => periodCount <= w.maxPeriods)?.className ?? CHART_MIN_WIDTH_MAX;
}

// Legend dots matching USER_COLORS, light then dark (Tailwind needs literal classes).
const USER_DOT_CLASSES = [
  "bg-[#2a78d6] dark:bg-[#3987e5]",
  "bg-[#eb6834] dark:bg-[#d95926]",
  "bg-[#1baf7a] dark:bg-[#199e70]",
  "bg-[#eda100] dark:bg-[#c98500]",
  "bg-[#e87ba4] dark:bg-[#d55181]",
  "bg-[#008300] dark:bg-[#008300]",
  "bg-[#6250d6] dark:bg-[#9085e9]",
  "bg-[#e34948] dark:bg-[#e66767]",
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Start scrolled to the newest period (the right end) whenever the data or the
  // day/week/month choice changes; does nothing when nothing overflows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [granularity, periods.length]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    // Room around the edge points for their numbers.
    layout: { padding: { left: 24, right: 24 } },
    plugins: {
      // Drawn as HTML above the scroll frame instead, so it stays visible while scrolling.
      legend: { display: false },
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
    <div className="flex flex-col gap-2">
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

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/80">
        {series.map((s, i) => (
          <li key={s.userName} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={`h-2.5 w-2.5 rounded-full ${USER_DOT_CLASSES[i % USER_DOT_CLASSES.length]}`}
            />
            {s.userName}
          </li>
        ))}
      </ul>

      <div ref={scrollRef} className="styled-scroll overflow-x-auto overscroll-x-contain pb-2">
        <div className={`h-72 md:h-64 ${chartMinWidthClass(periods.length)}`}>
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
    </div>
  );
}
