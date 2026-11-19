"use client";

import { useEffect, useRef } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "@/lib/money/pricing";
import type { EqualDaysComparison, EqualDaysSeller } from "@/lib/money/seller-comparison";
import type { TranslateFn } from "@/lib/i18n/translations";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { useIsNarrowScreen } from "@/hooks/useIsNarrowScreen";
import { CHART_COLORS, userColor } from "@/components/sales-charts/chart-theme";
import { chartMinWidthClass, comparisonChartHeightClass } from "@/components/finance/chart-width";
import { calculatedDaysText, DaysPerSellerBadge, FinanceCard } from "@/components/finance/FinanceCard";
import { amountAxis, categoryAxis, financeTooltip } from "@/components/finance/chart-style";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface SellerComparisonChartProps {
  comparison: EqualDaysComparison;
  // Every seller's id in a fixed order: each one keeps the same color in every period.
  sellerOrder: string[];
  // "12 nov" for a YYYY-MM-DD date.
  dayLabel: (date: string) => string;
  // "en esta semana": where the compared days come from.
  scope: string;
  t: TranslateFn;
}

// 0 at the start, then the running Neto − Pago after each compared day: the last point
// is the seller's total, the same as their bar.
function runningTotals(seller: EqualDaysSeller): number[] {
  let sum = 0;
  return [0, ...seller.byDay.map((d) => (sum += d.result))];
}

// The same figures as the bar chart — what each seller made the company earn over
// their last N days worked (N = the fewest days anyone worked in the period) — drawn
// as one line per seller that starts at 0 and adds each compared day (Day 1 … Day N),
// so it ends at the seller's total; a steeper line is a better day. Each seller has
// their own color, the same as their bar next to it (names are on the bars and in
// the tooltip).
export function SellerComparisonChart({ comparison, sellerOrder, dayLabel, scope, t }: SellerComparisonChartProps) {
  const mode = useIsDarkMode() ? "dark" : "light";
  const narrow = useIsNarrowScreen();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { days, sellers } = comparison;
  const title = t("finance.comparisonLineTitle");
  const colorOf = (userId: string) => userColor(Math.max(0, sellerOrder.indexOf(userId)), mode);
  const labels = [t("finance.start"), ...Array.from({ length: days }, (_, i) => t("finance.dayNumber", { n: i + 1 }))];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [comparison]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...financeTooltip(mode),
        itemSort: (a, b) => (b.parsed.y ?? 0) - (a.parsed.y ?? 0),
        callbacks: {
          footer: () => calculatedDaysText(days, t),
          label: (ctx) => {
            const seller = sellers[ctx.datasetIndex];
            const day = seller.byDay[ctx.dataIndex - 1];
            const total = `${seller.userName}: ${formatCurrency(ctx.parsed.y ?? 0)}`;
            return day ? `${total} (${dayLabel(day.date)}: ${formatCurrency(day.result)})` : total;
          },
        },
      },
    },
    scales: {
      x: categoryAxis(t("finance.axis.comparedDays"), narrow),
      y: amountAxis(mode, t("finance.axis.runningResult"), narrow),
    },
  };

  return (
    <FinanceCard
      title={title}
      subtitle={t("finance.comparisonLineSubtitle", { scope })}
      aside={<DaysPerSellerBadge days={days} t={t} />}
    >
      <div ref={scrollRef} className="styled-scroll mt-auto overflow-x-auto overscroll-x-contain">
        <div className={`${comparisonChartHeightClass(sellers.length)} ${chartMinWidthClass(labels.length)}`}>
          <Line
            options={options}
            aria-label={title}
            data={{
              labels,
              datasets: sellers.map((s) => ({
                label: s.userName,
                data: runningTotals(s),
                borderColor: colorOf(s.userId),
                backgroundColor: colorOf(s.userId),
                borderWidth: 2.5,
                cubicInterpolationMode: "monotone" as const,
                // The last point is the seller's total: drawn larger.
                pointRadius: labels.map((_, i) => (i === labels.length - 1 ? 5 : 3)),
                pointHoverRadius: 7,
                pointBorderColor: CHART_COLORS.surface[mode],
                pointBorderWidth: 2,
              })),
            }}
          />
        </div>
      </div>
    </FinanceCard>
  );
}
