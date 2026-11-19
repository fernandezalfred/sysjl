"use client";

import { useEffect, useRef } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "@/lib/money/pricing";
import type { PeriodNetProfit } from "@/lib/money/seller-comparison";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { Granularity } from "@/lib/date-buckets";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { useIsNarrowScreen } from "@/hooks/useIsNarrowScreen";
import { CHART_COLORS } from "@/components/sales-charts/chart-theme";
import { chartMinWidthClass } from "@/components/finance/chart-width";
import { FinanceCard } from "@/components/finance/FinanceCard";
import { amountAxis, areaGradient, categoryAxis, financeTooltip } from "@/components/finance/chart-style";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface NetProfitChartProps {
  periods: PeriodNetProfit[];
  label: (period: string) => string;
  // What one point is: a day, a week or a month.
  granularity: Granularity;
  t: TranslateFn;
}

// The company's total Neto as an area line, one point per day, week or month; the
// newest period is in view and older ones scroll in from the left.
export function NetProfitChart({ periods, label, granularity, t }: NetProfitChartProps) {
  const mode = useIsDarkMode() ? "dark" : "light";
  const narrow = useIsNarrowScreen();
  const scrollRef = useRef<HTMLDivElement>(null);
  const title = t("finance.netTrendTitle", { per: t(`finance.per.${granularity}`) });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [periods]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...financeTooltip(mode),
        displayColors: false,
        callbacks: { label: (ctx) => `${t("finance.netProfit")}: ${formatCurrency(ctx.parsed.y ?? 0)}` },
      },
    },
    scales: {
      x: categoryAxis(t(`trend.${granularity}`), narrow),
      y: amountAxis(mode, t("finance.axis.net"), narrow),
    },
  };

  return (
    <FinanceCard title={title} subtitle={t("finance.netTrendSubtitle", { unit: t(`finance.unit.${granularity}`) })}>
      <div ref={scrollRef} className="styled-scroll overflow-x-auto overscroll-x-contain -mx-1 pb-2">
        <div className={`h-64 ${chartMinWidthClass(periods.length)}`}>
          <Line
            options={options}
            aria-label={title}
            data={{
              labels: periods.map((p) => label(p.period)),
              datasets: [
                {
                  label: t("finance.netProfit"),
                  data: periods.map((p) => p.netProfit),
                  borderColor: CHART_COLORS.milkMote[mode],
                  backgroundColor: areaGradient(CHART_COLORS.milkMote[mode]),
                  fill: "origin",
                  borderWidth: 2.5,
                  cubicInterpolationMode: "monotone",
                  pointRadius: 3,
                  pointHoverRadius: 6,
                  pointBackgroundColor: CHART_COLORS.milkMote[mode],
                  pointBorderColor: CHART_COLORS.surface[mode],
                  pointBorderWidth: 2,
                },
              ],
            }}
          />
        </div>
      </div>
    </FinanceCard>
  );
}
