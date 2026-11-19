import { chartHeightClass } from "@/components/sales-charts/chart-theme";

// Line charts on Ingresos y egresos get at least ~4rem per point, then their frame
// scrolls sideways. Full class strings so Tailwind generates them.
const CHART_MIN_WIDTHS: { maxPoints: number; className: string }[] = [
  { maxPoints: 5, className: "" },
  { maxPoints: 8, className: "min-w-[32rem]" },
  { maxPoints: 12, className: "min-w-[48rem]" },
  { maxPoints: 16, className: "min-w-[64rem]" },
  { maxPoints: 20, className: "min-w-[80rem]" },
  { maxPoints: 24, className: "min-w-[96rem]" },
];

export function chartMinWidthClass(pointCount: number): string {
  return CHART_MIN_WIDTHS.find((w) => pointCount <= w.maxPoints)?.className ?? "min-w-[128rem]";
}

// The two seller comparison charts sit side by side: both get the same height so the
// cards line up — at least h-72, growing with the sellers like the bar chart, up to
// the bar chart's scroll frame (40rem past 24 sellers).
export function comparisonChartHeightClass(sellerCount: number): string {
  if (sellerCount <= 6) return "h-72";
  if (sellerCount <= 24) return chartHeightClass(sellerCount);
  return "h-[40rem]";
}
