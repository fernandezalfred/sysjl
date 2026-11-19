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
import { DEFAULT_TREND_LINES, topTrendSeries, type UserTrend } from "@/lib/sales-charts";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { CHART_COLORS, formatDayLabel, formatMonthLabel, userColor } from "@/components/sales-charts/chart-theme";
import { linePointLabels } from "@/components/sales-charts/chart-labels";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const GRANULARITIES: Granularity[] = ["day", "week", "month"];

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
  // Which sellers' lines are on: the top DEFAULT_TREND_LINES until the viewer picks.
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const shown = picked ?? new Set(topTrendSeries(trends.month.series));
  // Colors follow the name order, so a seller keeps theirs when others are hidden.
  const colorOf = (userId: string) => userColor(Math.max(0, series.findIndex((s) => s.userId === userId)), mode);
  const visibleSeries = series.filter((s) => shown.has(s.userId));
  const hasMore = series.length > DEFAULT_TREND_LINES;

  function toggle(userId: string) {
    const next = new Set(shown);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setPicked(next);
  }

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
            className={`min-h-9 rounded-md px-3 py-1 text-sm sm:min-h-0 ${
              granularity === g ? "bg-foreground/10 font-medium text-foreground" : "text-foreground/70"
            }`}
          >
            {t(`trend.${g}`)}
          </button>
        ))}
      </div>

      {/* The legend switches lines on and off; with many sellers it scrolls. */}
      <div className="flex flex-col gap-1.5">
        <ul className="styled-scroll flex max-h-28 flex-wrap gap-x-1 gap-y-1 overflow-y-auto text-xs">
          {series.map((s) => {
            const on = shown.has(s.userId);
            return (
              <li key={s.userId}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.userId)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-foreground/5 sm:px-1.5 sm:py-0.5 ${
                    on ? "text-foreground/80" : "text-foreground/40 line-through"
                  }`}
                >
                  <svg viewBox="0 0 10 10" aria-hidden="true" className="h-2.5 w-2.5 flex-shrink-0">
                    <circle cx="5" cy="5" r="5" fill={colorOf(s.userId)} opacity={on ? 1 : 0.35} />
                  </svg>
                  {s.userName}
                </button>
              </li>
            );
          })}
        </ul>
        {hasMore ? (
          <div className="flex flex-wrap gap-3 text-xs">
            <button type="button" onClick={() => setPicked(new Set(series.map((s) => s.userId)))} className="text-sky-700 hover:underline dark:text-sky-300">
              {t("trend.showAll", { count: series.length })}
            </button>
            <button type="button" onClick={() => setPicked(null)} className="text-sky-700 hover:underline dark:text-sky-300">
              {t("trend.showTop", { count: DEFAULT_TREND_LINES })}
            </button>
          </div>
        ) : null}
      </div>

      <div ref={scrollRef} className="styled-scroll overflow-x-auto overscroll-x-contain pb-2">
        <div className={`h-72 md:h-64 ${chartMinWidthClass(periods.length)}`}>
          <Line
            options={options}
            plugins={[linePointLabels({ ink: CHART_COLORS.ink[mode], surface: CHART_COLORS.surface[mode] })]}
            aria-label={t("salesCharts.trendTitle")}
            data={{
              labels: periods.map((p) => periodLabel(p, granularity, locale, t)),
              datasets: visibleSeries.map((s) => {
                const color = colorOf(s.userId);
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
