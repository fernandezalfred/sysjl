import { formatCurrency } from "@/lib/pricing";
import type { Plugin } from "chart.js";

// Amounts drawn directly on every bar and point so the charts read at a glance
// without hovering. Only the amount is written ("Bs 3.194"); legends, axis labels,
// and the text under each chart name what each mark is.
//
// An amount goes inside its own bar in white (the dataviz palette's label-inside-
// fill rule) when it fits. When it doesn't, it's drawn over that same bar or
// segment on a small label with the chart's surface color behind it and a border in
// the mark's color — so it stays readable and always sits on the mark it belongs to,
// never on a neighbouring bar.

const PADDING = 6;
const FONT = "12px sans-serif";
const INSIDE_COLOR = "#ffffff";
const PILL_PAD_X = 4;
const PILL_HEIGHT = 16;

// Chart labels use the app-wide whole-boliviano format: 1160.4 -> "Bs 1.160".
export function formatAmount(value: number): string {
  return formatCurrency(value);
}

export interface LabelTheme {
  ink: string;
  surface: string;
}

interface BarGeometry {
  x: number;
  y: number;
  base: number;
}

// Draws `text` centered at (cx, cy) on a rounded label: surface fill, border in
// `borderColor`, text in `textColor`.
function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  colors: { text: string; surface: string; border: string },
) {
  const width = ctx.measureText(text).width + PILL_PAD_X * 2;
  const left = cx - width / 2;
  const top = cy - PILL_HEIGHT / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, top, width, PILL_HEIGHT, 4);
  ctx.fillStyle = colors.surface;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.border;
  ctx.stroke();
  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function barColor(dataset: { backgroundColor?: unknown }, index: number, fallback: string): string {
  const color = dataset.backgroundColor;
  if (Array.isArray(color)) return String(color[index] ?? fallback);
  return typeof color === "string" ? color : fallback;
}

// Horizontal bars: the bar's category name (e.g. the user) inside its start and its
// series name with its amount ("Ventas: Bs 2.930") inside its end, both in
// white. If both don't fit, the name stays inside when it fits alone and the amount
// moves to a label over the bar's end; on a bar too short for either, one label over
// its end carries "name · series: amount".
export function horizontalBarLabels(theme: LabelTheme): Plugin<"bar"> {
  return {
    id: "horizontalBarLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = FONT;
      ctx.textBaseline = "middle";
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        chart.getDatasetMeta(datasetIndex).data.forEach((element, index) => {
          const { x, y, base } = element.getProps(["x", "y", "base"], true) as BarGeometry;
          const length = x - base;
          const name = String(chart.data.labels?.[index] ?? "");
          const value = formatAmount(Number(dataset.data[index] ?? 0));
          const amount = dataset.label ? `${dataset.label}: ${value}` : value;
          const nameWidth = ctx.measureText(name).width;
          const amountWidth = ctx.measureText(amount).width;
          const pillColors = { text: theme.ink, surface: theme.surface, border: barColor(dataset, index, theme.ink) };
          // Starts at the bar's end, shifted left when it would run past the chart's
          // right edge (narrow phone screens) so it's never cut off.
          const pillAtEnd = (text: string) => {
            const width = ctx.measureText(text).width + PILL_PAD_X * 2;
            const left = Math.max(chart.chartArea.left, Math.min(x, chart.chartArea.right - width));
            drawPill(ctx, text, left + width / 2, y, pillColors);
          };

          ctx.fillStyle = INSIDE_COLOR;
          if (nameWidth + amountWidth + PADDING * 3 <= length) {
            ctx.fillText(name, base + PADDING, y);
            ctx.fillText(amount, x - PADDING - amountWidth, y);
          } else if (nameWidth + PADDING * 2 <= length) {
            ctx.fillText(name, base + PADDING, y);
            pillAtEnd(amount);
          } else {
            pillAtEnd(`${name} · ${amount}`);
          }
        });
      });
      ctx.restore();
    },
  };
}

// Vertical stacked bars: each segment's amount written bottom-to-top inside it, or
// on a label centered over that same segment when it's too short.
// `textColors[datasetIndex]` colors a segment's label text (e.g. red for unsold).
export function verticalSegmentLabels(theme: LabelTheme, textColors: string[]): Plugin<"bar"> {
  return {
    id: "verticalSegmentLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = FONT;
      ctx.textBaseline = "middle";
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        chart.getDatasetMeta(datasetIndex).data.forEach((element, index) => {
          const value = Number(dataset.data[index] ?? 0);
          if (value <= 0) return;
          const { x, y, base } = element.getProps(["x", "y", "base"], true) as BarGeometry;
          const text = formatAmount(value);
          if (ctx.measureText(text).width + PADDING * 2 <= base - y) {
            ctx.save();
            ctx.fillStyle = INSIDE_COLOR;
            ctx.translate(x, base - PADDING);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          } else {
            drawPill(ctx, text, x, (y + base) / 2, {
              text: textColors[datasetIndex] ?? theme.ink,
              surface: theme.surface,
              border: barColor(dataset, index, theme.ink),
            });
          }
        });
      });
      ctx.restore();
    },
  };
}

// Lines: the amount at every point, on a label so it reads over grid lines and other
// lines. At each period the highest point's amount goes above it and the others
// below theirs, so close lines don't print on top of each other.
export function linePointLabels(theme: LabelTheme): Plugin<"line"> {
  return {
    id: "linePointLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = FONT;
      const pointCount = Math.max(0, ...chart.data.datasets.map((d) => d.data.length));

      for (let index = 0; index < pointCount; index++) {
        const points = chart.data.datasets
          .map((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            const element = meta.data[index];
            if (meta.hidden || !element) return null;
            const { x, y } = element.getProps(["x", "y"], true) as { x: number; y: number };
            return { x, y, value: Number(dataset.data[index] ?? 0), color: String(dataset.borderColor ?? theme.ink) };
          })
          .filter((p): p is { x: number; y: number; value: number; color: string } => p !== null)
          .sort((a, b) => a.y - b.y);

        points.forEach((p, i) => {
          const offset = PADDING + PILL_HEIGHT / 2;
          drawPill(ctx, formatAmount(p.value), p.x, i === 0 ? p.y - offset : p.y + offset, {
            text: theme.ink,
            surface: theme.surface,
            border: p.color,
          });
        });
      }
      ctx.restore();
    },
  };
}
