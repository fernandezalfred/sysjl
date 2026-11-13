"use client";

import { useMemo, useState } from "react";
import { buildFinanceByPeriod, buildSellerFinance } from "@/lib/money/finance";
import { buildGrainsShareByDate, type UnitCosts } from "@/lib/money/revenue";
import { buildFinanceReport } from "@/lib/reports";
import type { Granularity } from "@/lib/date-buckets";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow } from "@/types/daily-records";
import { formatDayLabel, formatMonthLabel } from "@/components/sales-charts/chart-theme";
import { FinanceChart } from "@/components/finance/FinanceCharts";
import { FinanceSummary } from "@/components/finance/FinanceSummary";
import { PeriodFinanceTable, SellerFinanceTable } from "@/components/finance/FinanceTables";
import { FinanceExport } from "@/components/finance/FinanceExport";

const GRANULARITIES: Granularity[] = ["day", "week", "month"];

function periodLabel(period: string, granularity: Granularity, locale: Locale, t: TranslateFn): string {
  if (granularity === "month") return formatMonthLabel(period, locale);
  if (granularity === "week") return t("trend.weekOf", { date: formatDayLabel(period, locale) });
  return formatDayLabel(period, locale);
}

interface FinanceSectionProps {
  dailyRecords: DailyRecordRow[];
  unitCosts: UnitCosts;
  grainsCostByDay: Record<string, number>;
  // When the data was read, already formatted on the server (formatting it here would
  // give a different string in the browser and break hydration).
  generatedAt: string;
  locale: Locale;
}

// Admin only: what a branch administrator needs from every seller's sale records — for
// the chosen day, week or month: income per product, costs, Ganancia neta, pay and
// result, per seller too; charts and a table over every period; CSV / Excel / print.
export function FinanceSection({ dailyRecords, unitCosts, grainsCostByDay, generatedAt, locale }: FinanceSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [pickedPeriod, setPickedPeriod] = useState<string | null>(null);

  const periods = useMemo(
    () => buildFinanceByPeriod(dailyRecords, unitCosts, grainsCostByDay, granularity),
    [dailyRecords, unitCosts, grainsCostByDay, granularity],
  );
  const deductions = useMemo(
    () => ({ grainsShareByDate: buildGrainsShareByDate(grainsCostByDay, dailyRecords) }),
    [grainsCostByDay, dailyRecords],
  );
  const selected = periods.find((p) => p.period === pickedPeriod) ?? periods[periods.length - 1];
  const sellers = useMemo(
    () => (selected ? buildSellerFinance(dailyRecords, unitCosts, deductions, granularity, selected.period) : []),
    [dailyRecords, unitCosts, deductions, granularity, selected],
  );
  const label = (p: string) => periodLabel(p, granularity, locale, t);

  if (!selected) return <p className="text-sm text-foreground/70">{t("trend.noData")}</p>;

  const buildTables = () => buildFinanceReport({ label: label(selected.period), figures: selected }, periods, label, sellers, t);

  return (
    <div className="flex flex-col gap-8 print:gap-5">
      {/* Only on paper: what the printout is and when it was made. */}
      <div className="hidden print:block">
        <p className="text-lg font-semibold">
          {t("header.finance")} · {t(`trend.${granularity}`)}: {label(selected.period)}
        </p>
        <p className="text-xs text-foreground/60">{t("finance.printedAt", { date: generatedAt })}</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="inline-flex self-start rounded-lg border border-foreground/15 p-1">
            {GRANULARITIES.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={granularity === g}
                onClick={() => {
                  setGranularity(g);
                  setPickedPeriod(null);
                }}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  granularity === g ? "bg-foreground/10 font-medium text-foreground" : "text-foreground/70"
                }`}
              >
                {t(`trend.${g}`)}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-foreground/70">
            {t("finance.selectPeriod")}
            <select
              value={selected.period}
              onChange={(event) => setPickedPeriod(event.target.value)}
              className="rounded-lg border border-foreground/20 bg-background px-3 py-2 text-base text-foreground sm:text-sm"
            >
              {[...periods].reverse().map((p) => (
                <option key={p.period} value={p.period}>
                  {label(p.period)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <FinanceExport buildTables={buildTables} fileName={`${t("finance.export.fileName")}-${selected.period}`} t={t} />
      </div>

      <FinanceSummary figures={selected} t={t} />
      <SellerFinanceTable sellers={sellers} t={t} />
      <FinanceChart title={t("finance.chartTitle")} periods={periods} label={label} t={t} kind="incomeExpenses" />
      <FinanceChart title={t("finance.resultChartTitle")} periods={periods} label={label} t={t} kind="result" />
      <PeriodFinanceTable periods={periods} label={label} t={t} />
    </div>
  );
}
