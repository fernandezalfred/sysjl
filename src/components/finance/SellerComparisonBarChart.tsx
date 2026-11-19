"use client";

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, type ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "@/lib/money/pricing";
import type { EqualDaysComparison } from "@/lib/money/seller-comparison";
import type { TranslateFn } from "@/lib/i18n/translations";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { useIsNarrowScreen } from "@/hooks/useIsNarrowScreen";
import { CHART_COLORS, chartHeightClass, chartScrollFrameClass, userColor } from "@/components/sales-charts/chart-theme";
import { horizontalBarLabels } from "@/components/sales-charts/chart-labels";
import { comparisonChartHeightClass } from "@/components/finance/chart-width";
import { calculatedDaysText, DaysPerSellerBadge, FinanceCard } from "@/components/finance/FinanceCard";
import { amountAxis, financeTooltip } from "@/components/finance/chart-style";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface SellerComparisonBarChartProps {
  comparison: EqualDaysComparison;
  // Every seller's id in a fixed order: each one keeps the same color in every period.
  sellerOrder: string[];
  // "en esta semana": where the compared days come from.
  scope: string;
  t: TranslateFn;
}

// One bar per seller, best first: Neto − Pago over each seller's last N days worked
// (N = the fewest days anyone worked in the period), so sellers who worked more days
// don't win a bonus just for that. Name and amount are written on each bar; each
// seller has their own color. The caller shows the comparison hint and empty state.
export function SellerComparisonBarChart({ comparison, sellerOrder, scope, t }: SellerComparisonBarChartProps) {
  const mode = useIsDarkMode() ? "dark" : "light";
  const narrow = useIsNarrowScreen();
  const { days, sellers } = comparison;
  const title = t("finance.comparisonTitle");

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...financeTooltip(mode),
        callbacks: {
          label: (ctx) => `${t("finance.result")}: ${formatCurrency(ctx.parsed.x ?? 0)}`,
          afterLabel: () => calculatedDaysText(days, t),
        },
      },
    },
    scales: {
      x: { ...amountAxis(mode, t("finance.axis.result"), narrow), grace: "15%" },
      y: {
        // Seller names are written inside the bars.
        ticks: { display: false },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <FinanceCard title={title} subtitle={t("finance.comparisonBarSubtitle", { scope })} aside={<DaysPerSellerBadge days={days} t={t} />}>
      <div className={`mt-auto ${chartScrollFrameClass(sellers.length)}`}>
        <div className={sellers.length > 24 ? chartHeightClass(sellers.length) : comparisonChartHeightClass(sellers.length)}>
          <Bar
            options={options}
            plugins={[horizontalBarLabels({ ink: CHART_COLORS.ink[mode], surface: CHART_COLORS.surface[mode] })]}
            aria-label={title}
            data={{
              labels: sellers.map((s) => s.userName),
              datasets: [
                {
                  label: t("finance.result"),
                  data: sellers.map((s) => s.result),
                  backgroundColor: sellers.map((s) => userColor(Math.max(0, sellerOrder.indexOf(s.userId)), mode)),
                  borderRadius: 8,
                  borderSkipped: false,
                  maxBarThickness: 28,
                  categoryPercentage: 0.8,
                  barPercentage: 0.85,
                  hoverBorderWidth: 2,
                  hoverBorderColor: CHART_COLORS.ink[mode],
                },
              ],
            }}
          />
        </div>
      </div>
    </FinanceCard>
  );
}
