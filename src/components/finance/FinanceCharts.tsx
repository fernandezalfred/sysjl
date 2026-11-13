"use client";

import { useEffect, useRef } from "react";
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
import { formatCurrency } from "@/lib/money/pricing";
import type { PeriodFinance } from "@/lib/money/finance";
import type { TranslateFn } from "@/lib/i18n/translations";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { CHART_COLORS } from "@/components/sales-charts/chart-theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Categorical slots 1 and 2 of the dataviz palette (blue, orange), validated as a pair
// in light and dark; the result chart is a single series in violet (slot 7), the app's
// net-profit hue.
const FINANCE_COLORS = {
  income: { light: "#2a78d6", dark: "#3987e5" },
  expenses: { light: "#eb6834", dark: "#d95926" },
  result: { light: "#6250d6", dark: "#9085e9" },
};

export const INCOME_DOT = "bg-[#2a78d6] dark:bg-[#3987e5]";
export const EXPENSES_DOT = "bg-[#eb6834] dark:bg-[#d95926]";
export const RESULT_DOT = "bg-[#6250d6] dark:bg-[#9085e9]";

// At least ~4rem per period, then the chart scrolls sideways (same tiers as the trend chart).
const CHART_MIN_WIDTHS: { maxPeriods: number; className: string }[] = [
  { maxPeriods: 5, className: "" },
  { maxPeriods: 8, className: "min-w-[32rem]" },
  { maxPeriods: 12, className: "min-w-[48rem]" },
  { maxPeriods: 16, className: "min-w-[64rem]" },
  { maxPeriods: 20, className: "min-w-[80rem]" },
  { maxPeriods: 24, className: "min-w-[96rem]" },
];

function chartMinWidthClass(periodCount: number): string {
  return CHART_MIN_WIDTHS.find((w) => periodCount <= w.maxPeriods)?.className ?? "min-w-[128rem]";
}

interface FinanceChartProps {
  title: string;
  periods: PeriodFinance[];
  label: (period: string) => string;
  t: TranslateFn;
  kind: "incomeExpenses" | "result";
}

// Ingresos vs Egresos (costs + pay) as grouped bars, or the Resultado as a single series,
// one bar per period; the newest period is in view, older ones scroll in from the left.
export function FinanceChart({ title, periods, label, t, kind }: FinanceChartProps) {
  const mode = useIsDarkMode() ? "dark" : "light";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [periods]);

  const bar = { borderRadius: 4, borderSkipped: "start" as const, maxBarThickness: 36 };
  const datasets =
    kind === "incomeExpenses"
      ? [
          { ...bar, label: t("finance.income"), data: periods.map((p) => p.income.total), backgroundColor: FINANCE_COLORS.income[mode] },
          { ...bar, label: t("finance.expenses"), data: periods.map((p) => p.costs.total + p.pay), backgroundColor: FINANCE_COLORS.expenses[mode] },
        ]
      : [{ ...bar, label: t("finance.result"), data: periods.map((p) => p.result), backgroundColor: FINANCE_COLORS.result[mode] }];

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    datasets: { bar: { categoryPercentage: 0.7, barPercentage: 0.9 } },
    plugins: {
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
        {kind === "incomeExpenses" ? (
          <ul className="flex gap-4 text-xs text-foreground/80">
            <LegendItem label={t("finance.income")} dotClass={INCOME_DOT} />
            <LegendItem label={t("finance.expenses")} dotClass={EXPENSES_DOT} />
          </ul>
        ) : null}
      </div>
      <div ref={scrollRef} className="styled-scroll overflow-x-auto overscroll-x-contain rounded-xl border border-foreground/10 p-3 pb-2 print:overflow-visible">
        <div className={`h-64 ${chartMinWidthClass(periods.length)} print:min-w-0`}>
          <Bar options={options} aria-label={title} data={{ labels: periods.map((p) => label(p.period)), datasets }} />
        </div>
      </div>
    </section>
  );
}

function LegendItem({ label, dotClass }: { label: string; dotClass: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${dotClass}`} />
      {label}
    </li>
  );
}
