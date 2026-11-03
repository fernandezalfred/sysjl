"use client";

import { useEffect, useState } from "react";
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
import { formatCurrency, PRODUCT_LABEL_KEYS } from "@/lib/pricing";
import { translate, type Locale } from "@/lib/i18n/translations";
import type { ProductInvestmentDetail } from "@/lib/investment";
import type { ProductCode } from "@/types/landing";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Palette slots 1 (blue) and 2 (orange) from the dataviz skill's validated
// categorical order — re-run `validate_palette.js` before changing these.
const COLORS = {
  blue: { light: "#2a78d6", dark: "#3987e5" },
  orange: { light: "#eb6834", dark: "#d95926" },
  grid: { light: "#e1e0d9", dark: "#2c2c2a" },
  axis: { light: "#c3c2b7", dark: "#383835" },
  muted: "#898781",
  ink: { light: "#0b0b0b", dark: "#f0efec" },
};

// Each product keeps one fixed color across both charts (and across light/dark),
// so "Queso" always means the same hue wherever it appears — color follows the
// product, not the metric.
const PRODUCT_COLORS: Record<ProductCode, { light: string; dark: string }> = {
  QUESO: COLORS.blue,
  YOGURT: COLORS.orange,
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

interface ProductInvestmentChartsProps {
  details: ProductInvestmentDetail[];
  locale: Locale;
}

export function ProductInvestmentCharts({ details, locale }: ProductInvestmentChartsProps) {
  const t = (key: string) => translate(locale, key);
  const isDark = useIsDarkMode();
  const mode = isDark ? "dark" : "light";
  const ink = COLORS.ink[mode];
  const muted = COLORS.muted;
  const grid = COLORS.grid[mode];
  const axis = COLORS.axis[mode];

  const sharedScales: ChartOptions<"bar">["scales"] = {
    x: {
      ticks: { color: muted, font: { size: 12 } },
      grid: { display: false },
      border: { color: axis },
    },
    y: {
      beginAtZero: true,
      ticks: { color: muted, font: { size: 12 } },
      grid: { color: grid },
      border: { display: false },
    },
  };

  const legendOptions = { position: "top" as const, labels: { color: ink, font: { size: 12 } } };

  const bsOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendOptions,
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}` } },
    },
    scales: sharedScales,
  };

  const unitsOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendOptions,
      tooltip: {},
    },
    scales: sharedScales,
  };

  const bsLabels = [t("investment.investment"), t("investment.revenue")];
  const unitsLabels = [t("investment.sold"), t("investment.left")];

  const productDataset = (label: string, color: { light: string; dark: string }, data: number[]) => ({
    label,
    data,
    backgroundColor: color[mode],
    maxBarThickness: 24,
  });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground/80">{t("investment.chartInvestmentTitle")}</h3>
        <div className="h-56">
          <Bar
            options={bsOptions}
            data={{
              labels: bsLabels,
              datasets: details.map((d) =>
                productDataset(t(PRODUCT_LABEL_KEYS[d.product]), PRODUCT_COLORS[d.product], [d.investment, d.revenue]),
              ),
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground/80">{t("investment.chartSoldLeftTitle")}</h3>
        <div className="h-56">
          <Bar
            options={unitsOptions}
            data={{
              labels: unitsLabels,
              datasets: details.map((d) => productDataset(t(PRODUCT_LABEL_KEYS[d.product]), PRODUCT_COLORS[d.product], [d.sold, d.left])),
            }}
          />
        </div>
      </div>
    </div>
  );
}
