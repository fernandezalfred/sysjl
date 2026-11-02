"use client";

import { useEffect, useMemo, useState } from "react";
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
import { aggregateByPeriod, formatPeriodLabel, type Granularity, type TrendItem } from "@/lib/date-buckets";
import { translate, type Locale } from "@/lib/i18n/translations";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const COLORS = {
  blue: { light: "#2a78d6", dark: "#3987e5" },
  grid: { light: "#e1e0d9", dark: "#2c2c2a" },
  axis: { light: "#c3c2b7", dark: "#383835" },
  muted: "#898781",
};

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return isDark;
}

const GRANULARITIES: Granularity[] = ["day", "week", "month"];

interface SaleRecordsTrendChartProps {
  items: TrendItem[];
  locale: Locale;
}

export function SaleRecordsTrendChart({ items, locale }: SaleRecordsTrendChartProps) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const isDark = useIsDarkMode();
  const mode = isDark ? "dark" : "light";

  const periods = useMemo(() => aggregateByPeriod(items, granularity), [items, granularity]);

  const labels = periods.map((p) =>
    granularity === "week" ? t("trend.weekOf", { date: formatPeriodLabel(p.period, "week") }) : formatPeriodLabel(p.period, granularity),
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y ?? 0) } },
    },
    scales: {
      x: {
        ticks: { color: COLORS.muted, font: { size: 12 } },
        grid: { display: false },
        border: { color: COLORS.axis[mode] },
      },
      y: {
        beginAtZero: true,
        ticks: { color: COLORS.muted, font: { size: 12 } },
        grid: { color: COLORS.grid[mode] },
        border: { display: false },
      },
    },
  };

  if (items.length === 0) {
    return <p className="text-sm text-foreground/60">{t("trend.noData")}</p>;
  }

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
              granularity === g ? "bg-foreground/10 font-medium text-foreground" : "text-foreground/60"
            }`}
          >
            {t(`trend.${g}`)}
          </button>
        ))}
      </div>

      <div className="h-64">
        <Line
          options={options}
          data={{
            labels,
            datasets: [
              {
                data: periods.map((p) => p.total),
                borderColor: COLORS.blue[mode],
                backgroundColor: COLORS.blue[mode],
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2,
                tension: 0,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
