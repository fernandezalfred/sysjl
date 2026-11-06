"use client";

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, type ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatCurrency, PRODUCT_LABEL_KEYS } from "@/lib/money/pricing";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { ProductDaySales, UserProductSales } from "@/lib/sales-charts";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { CHART_COLORS } from "@/components/sales-charts/chart-theme";
import { verticalSegmentLabels } from "@/components/sales-charts/chart-labels";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Mode = "light" | "dark";

interface ProductBar {
  label: string;
  color: { light: string; dark: string };
  // Bottom segment: sold, in Bs.
  revenue: number;
  // Units sold/left for Queso and Yogurt; null where the record has no unit tracking.
  sold: number | null;
  remaining: number | null;
  // Top (red) segment: value of unsold stock, in Bs.
  remainingValue: number;
}

function productBar(label: string, color: ProductBar["color"], p: ProductDaySales): ProductBar {
  return {
    label,
    color,
    revenue: p.revenue,
    sold: p.sold,
    remaining: p.remaining,
    remainingValue: p.remainingValue,
  };
}

function barsFor(u: UserProductSales, t: TranslateFn): ProductBar[] {
  return [
    productBar(t(PRODUCT_LABEL_KEYS.QUESO), CHART_COLORS.queso, u.queso),
    productBar(t(PRODUCT_LABEL_KEYS.YOGURT), CHART_COLORS.yogurt, u.yogurt),
    // Milk & Mote: recorded as one Bs figure, no unit or leftover tracking.
    {
      label: t("table.milkMote"),
      color: CHART_COLORS.milkMote,
      revenue: u.milkMoteRevenue,
      sold: null,
      remaining: null,
      remainingValue: 0,
    },
  ];
}

function chartOptions(bars: ProductBar[], sharedMax: number, mode: Mode, t: TranslateFn): ChartOptions<"bar"> {
  const units = t("summaryCards.units");
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const bar = bars[ctx.dataIndex];
            if (ctx.datasetIndex === 1) {
              const unsoldUnits = bar.remaining === null ? "" : `${bar.remaining} ${units} · `;
              return `${t("salesCharts.unsold")}: ${unsoldUnits}${formatCurrency(bar.remainingValue)}`;
            }
            const amount = formatCurrency(bar.revenue);
            return bar.sold === null ? amount : `${bar.sold} ${units} · ${amount}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: CHART_COLORS.ink[mode], font: { size: 12 } },
        grid: { display: false },
        border: { color: CHART_COLORS.axis[mode] },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        suggestedMax: sharedMax,
        ticks: { color: CHART_COLORS.muted, font: { size: 12 } },
        grid: { color: CHART_COLORS.grid[mode] },
        border: { display: false },
      },
    },
  };
}

interface LastDayProductChartsProps {
  users: UserProductSales[];
  locale: Locale;
}

// Small multiples: one chart per user of the latest work day, per product, in Bs —
// what sold (product color) with what was left over stacked on top in red. Every
// chart shares one y-axis maximum so users compare fairly.
export function LastDayProductCharts({ users, locale }: LastDayProductChartsProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const mode: Mode = useIsDarkMode() ? "dark" : "light";
  // Amounts too long for their segment go on a label over it: sold in text ink, unsold in red.
  const segmentLabels = verticalSegmentLabels(
    { ink: CHART_COLORS.ink[mode], surface: CHART_COLORS.surface[mode] },
    [CHART_COLORS.ink[mode], CHART_COLORS.unsold[mode]],
  );
  const sharedMax = Math.max(
    1,
    ...users.flatMap((u) => barsFor(u, t).map((b) => b.revenue + b.remainingValue)),
  );

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {users.map((u) => {
        const bars = barsFor(u, t);
        return (
          <div key={u.userId} className="flex flex-col gap-2 rounded-lg border border-foreground/10 p-4">
            <h4 className="text-sm font-medium">{u.userName}</h4>
            <div className="h-56">
              <Bar
                options={chartOptions(bars, sharedMax, mode, t)}
                plugins={[segmentLabels]}
                aria-label={t("salesCharts.productsFor", { name: u.userName })}
                data={{
                  // Only the product name under each bar; amounts are written on the bars.
                  labels: bars.map((b) => b.label),
                  datasets: [
                    {
                      data: bars.map((b) => b.revenue),
                      backgroundColor: bars.map((b) => b.color[mode]),
                      maxBarThickness: 40,
                    },
                    {
                      data: bars.map((b) => b.remainingValue),
                      backgroundColor: CHART_COLORS.unsold[mode],
                      // 2px surface gap between the sold and unsold segments.
                      borderColor: CHART_COLORS.surface[mode],
                      borderWidth: { bottom: 2 },
                      borderSkipped: false,
                      borderRadius: { topLeft: 4, topRight: 4 },
                      maxBarThickness: 40,
                    },
                  ],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
