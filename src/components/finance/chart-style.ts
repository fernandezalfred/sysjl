import type { Chart, ScriptableContext, TooltipOptions } from "chart.js";
import { formatCurrency } from "@/lib/money/pricing";
import { CHART_COLORS } from "@/components/sales-charts/chart-theme";

// Shared look of the Ingresos y egresos charts: tooltip, axes and the area gradient.

type Mode = "light" | "dark";

const FONT = { size: 12 };

export function financeTooltip(mode: Mode): Partial<TooltipOptions<"bar" | "line">> {
  const dark = mode === "dark";
  return {
    backgroundColor: dark ? "#262624" : "#ffffff",
    titleColor: CHART_COLORS.ink[mode],
    bodyColor: dark ? "#d6d5d0" : "#3d3d3a",
    borderColor: dark ? "#3a3a37" : "#e1e0d9",
    borderWidth: 1,
    padding: 12,
    cornerRadius: 10,
    boxPadding: 5,
    usePointStyle: true,
    titleFont: { ...FONT, weight: 600 },
    bodyFont: FONT,
    titleMarginBottom: 6,
    caretSize: 6,
  };
}

// An axis title: what the axis measures, in small muted text.
function axisTitle(text: string | undefined) {
  return text ? { display: true, text, color: CHART_COLORS.muted, font: { size: 11, weight: 600 as const }, padding: 4 } : undefined;
}

// The amount axis: Bs labels, a few dashed grid lines, no axis line, optional title.
export function amountAxis(mode: Mode, title?: string) {
  return {
    beginAtZero: true,
    title: axisTitle(title),
    grace: "8%" as const,
    ticks: {
      color: CHART_COLORS.muted,
      font: FONT,
      padding: 8,
      maxTicksLimit: 6,
      callback: (value: number | string) => formatCurrency(Number(value)),
    },
    grid: { color: CHART_COLORS.grid[mode], drawTicks: false },
    border: { display: false, dash: [4, 4] },
  };
}

// The category axis (days, periods): labels and an optional title.
export function categoryAxis(title?: string) {
  return {
    title: axisTitle(title),
    ticks: { color: CHART_COLORS.muted, font: FONT, padding: 8, maxRotation: 0, autoSkipPadding: 12 },
    grid: { display: false },
    border: { display: false },
  };
}

// Fill under an area line: the line color fading to transparent toward the bottom.
// `color` is a #rrggbb hex.
export function areaGradient(color: string) {
  return (context: ScriptableContext<"line">) => {
    const { ctx, chartArea } = context.chart as Chart;
    if (!chartArea) return `${color}22`;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, `${color}55`);
    gradient.addColorStop(1, `${color}00`);
    return gradient;
  };
}
