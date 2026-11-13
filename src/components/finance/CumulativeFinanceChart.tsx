"use client";

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
import type { PeriodFinance } from "@/lib/money/finance";
import type { TranslateFn } from "@/lib/i18n/translations";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { CHART_COLORS } from "@/components/sales-charts/chart-theme";
import { EXPENSES_DOT, FINANCE_COLORS, INCOME_DOT, RESULT_DOT } from "@/components/finance/FinanceCharts";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface CumulativeFinanceChartProps {
  title: string;
  // Running totals (cumulativeFinance), oldest first.
  periods: PeriodFinance[];
  label: (period: string) => string;
  t: TranslateFn;
}

// "Desde el inicio": income, investment and accumulated net profit adding up from the
// first sale, one point per period.
export function CumulativeFinanceChart({ title, periods, label, t }: CumulativeFinanceChartProps) {
  const mode = useIsDarkMode() ? "dark" : "light";
  const line = (name: string, data: number[], color: string) => ({
    label: name,
    data,
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    pointRadius: periods.length > 40 ? 0 : 2.5,
    pointHoverRadius: 4,
    tension: 0.2,
  });

  const datasets = [
    line(t("finance.income"), periods.map((p) => p.income.total), FINANCE_COLORS.income[mode]),
    line(t("finance.investment"), periods.map((p) => p.costs.total), FINANCE_COLORS.expenses[mode]),
    line(t("finance.accumulatedNet"), periods.map((p) => p.result), FINANCE_COLORS.result[mode]),
  ];

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}` } },
    },
    scales: {
      x: {
        ticks: { color: CHART_COLORS.muted, font: { size: 12 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
        grid: { display: false },
        border: { color: CHART_COLORS.axis[mode] },
      },
      y: {
        ticks: { color: CHART_COLORS.muted, font: { size: 12 }, callback: (value) => formatCurrency(Number(value)) },
        grid: { color: CHART_COLORS.grid[mode] },
        border: { display: false },
      },
    },
  };

  return (
    <section className="flex break-inside-avoid flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground/80">{title}</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/80">
          {[
            { name: t("finance.income"), dot: INCOME_DOT },
            { name: t("finance.investment"), dot: EXPENSES_DOT },
            { name: t("finance.accumulatedNet"), dot: RESULT_DOT },
          ].map((item) => (
            <li key={item.name} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
              {item.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="h-72 rounded-xl border border-foreground/10 p-3">
        <Line options={options} aria-label={title} data={{ labels: periods.map((p) => label(p.period)), datasets }} />
      </div>
    </section>
  );
}
