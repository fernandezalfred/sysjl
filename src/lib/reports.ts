import { GRAINS, GRAIN_LABEL_KEYS, type FinanceFigures, type PeriodFinance, type SellerFinance } from "@/lib/money/finance";
import type { TranslateFn } from "@/lib/i18n/translations";

export type ReportCell = string | number;

export interface ReportTable {
  // Sheet name in Excel, section title in CSV.
  title: string;
  header: string[];
  rows: ReportCell[][];
}

// Amounts in reports are whole bolivianos, like on screen.
const bs = (value: number) => Math.round(value);

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";
}

// The three tables of the income & expenses report: the chosen period's summary, every
// period, and every seller in the chosen period. `sinceStart`: the summary covers
// everything since the first sale (costs read as the total investment, the result as
// the accumulated net profit) and `periods` are running totals per month.
export function buildFinanceReport(
  selected: { label: string; figures: FinanceFigures },
  periods: PeriodFinance[],
  periodLabel: (period: string) => string,
  sellers: SellerFinance[],
  t: TranslateFn,
  sinceStart = false,
): ReportTable[] {
  const f = selected.figures;
  const costsLabel = sinceStart ? t("finance.investment") : t("finance.costs");
  const resultLabel = sinceStart ? t("finance.accumulatedNet") : t("finance.result");
  const summary: ReportTable = {
    title: t("finance.report.summary"),
    header: [t("finance.report.concept"), t("finance.report.amount"), t("finance.report.detail")],
    rows: [
      [t("finance.period"), selected.label, ""],
      [t("finance.report.records"), f.records, ""],
      [
        t("product.queso"),
        bs(f.income.queso),
        t("finance.unitsDetail", { taken: f.units.quesoTaken, sold: f.units.queso, left: f.units.quesoRemaining }),
      ],
      [
        t("product.yogurt"),
        bs(f.income.yogurt),
        t("finance.unitsDetail", { taken: f.units.yogurtTaken, sold: f.units.yogurt, left: f.units.yogurtRemaining }),
      ],
      [t("table.milkMote"), bs(f.income.milkMote), percent(f.income.milkMote, f.income.total)],
      [t("finance.totalSold"), bs(f.income.total), "100%"],
      [t("finance.costQueso"), bs(f.costs.queso), ""],
      [t("finance.costYogurt"), bs(f.costs.yogurt), ""],
      [t("finance.milk"), bs(f.costs.milk), t("finance.liters", { count: f.units.milkLiters })],
      ...GRAINS.map((g): ReportCell[] => [t(GRAIN_LABEL_KEYS[g]), bs(f.costs.grainsByProduct[g]), t("header.grains")]),
      [costsLabel, bs(f.costs.total), percent(f.costs.total, f.income.total)],
      [t("finance.netProfit"), bs(f.netProfit), percent(f.netProfit, f.income.total)],
      [t("finance.pay"), bs(f.pay), ""],
      [resultLabel, bs(f.result), percent(f.result, f.income.total)],
      [t("finance.unsold"), bs(f.unsoldValue), ""],
    ],
  };

  const byPeriod: ReportTable = {
    title: sinceStart ? t("finance.cumulativeTableTitle") : t("finance.report.byPeriod"),
    header: [
      t("finance.period"),
      t("product.queso"),
      t("product.yogurt"),
      t("table.milkMote"),
      t("finance.income"),
      costsLabel,
      t("finance.netProfit"),
      t("finance.pay"),
      resultLabel,
    ],
    rows: [...periods].reverse().map((p) => [
      periodLabel(p.period),
      bs(p.income.queso),
      bs(p.income.yogurt),
      bs(p.income.milkMote),
      bs(p.income.total),
      bs(p.costs.total),
      bs(p.netProfit),
      bs(p.pay),
      bs(p.result),
    ]),
  };

  const bySeller: ReportTable = {
    title: t("finance.report.bySeller"),
    header: [t("table.user"), t("finance.days"), t("finance.sales"), t("finance.netProfit"), t("finance.pay"), t("finance.result")],
    rows: sellers.map((s) => [s.userName, s.days, bs(s.sales), bs(s.netProfit), bs(s.pay), bs(s.result)]),
  };

  return [summary, byPeriod, bySeller];
}

function csvCell(cell: ReportCell): string {
  const text = String(cell);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Every table one after another (title line, header, rows, blank line), comma
// separated, with a BOM so Excel reads the accents correctly.
export function toCsv(tables: ReportTable[]): string {
  const lines: string[] = [];
  for (const table of tables) {
    lines.push(csvCell(table.title), table.header.map(csvCell).join(","));
    for (const row of table.rows) lines.push(row.map(csvCell).join(","));
    lines.push("");
  }
  return `﻿${lines.join("\r\n")}`;
}
