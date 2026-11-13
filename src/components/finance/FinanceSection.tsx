"use client";

import { useMemo, useState } from "react";
import {
  buildFinanceByPeriod,
  buildSellerFinance,
  cumulativeFinance,
  grainsTotalByDay,
  totalFinance,
  type GrainCosts,
  type PeriodFinance,
} from "@/lib/money/finance";
import { buildGrainsShareByDate, type UnitCosts } from "@/lib/money/revenue";
import { buildFinanceReport } from "@/lib/reports";
import type { Granularity } from "@/lib/date-buckets";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow } from "@/types/daily-records";
import { formatDayLabel, formatMonthLabel, intlLocale } from "@/components/sales-charts/chart-theme";
import { FinanceChart } from "@/components/finance/FinanceCharts";
import { CumulativeFinanceChart } from "@/components/finance/CumulativeFinanceChart";
import { FinanceSummary } from "@/components/finance/FinanceSummary";
import { PeriodFinanceTable, SellerFinanceTable } from "@/components/finance/FinanceTables";
import { FinanceExport } from "@/components/finance/FinanceExport";

// Día / Semana / Mes pick one period; "all" is every record since the first sale.
type FinanceView = Granularity | "all";
const VIEWS: FinanceView[] = ["day", "week", "month", "all"];
const SINCE_START = "all";

function periodLabel(period: string, granularity: Granularity, locale: Locale, t: TranslateFn): string {
  if (granularity === "month") return formatMonthLabel(period, locale);
  if (granularity === "week") return t("trend.weekOf", { date: formatDayLabel(period, locale) });
  return formatDayLabel(period, locale);
}

function viewLabel(view: FinanceView, t: TranslateFn): string {
  return view === SINCE_START ? t("finance.sinceStart") : t(`trend.${view}`);
}

// "3 oct 2026 – 13 nov 2026": the first and last day with data.
function sinceStartRange(days: PeriodFinance[], locale: Locale, t: TranslateFn): string {
  const format = (day: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(`${day}T00:00:00`),
    );
  return t("finance.sinceStartRange", { from: format(days[0].period), to: format(days[days.length - 1].period) });
}

interface FinanceSectionProps {
  dailyRecords: DailyRecordRow[];
  unitCosts: UnitCosts;
  // Grain purchase cost per day, per grain.
  grainsCostByDay: Record<string, GrainCosts>;
  // When the data was read, already formatted on the server (formatting it here would
  // give a different string in the browser and break hydration).
  generatedAt: string;
  locale: Locale;
}

// Admin only: what a branch administrator needs from every seller's sale records — for
// the chosen day, week or month, or everything since the first sale: income per
// product, costs (the investment), Neto, pay and result, per seller too; charts and a
// table over every period (running totals since the beginning); CSV / Excel / print.
export function FinanceSection({ dailyRecords, unitCosts, grainsCostByDay, generatedAt, locale }: FinanceSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [view, setView] = useState<FinanceView>("day");
  const [pickedPeriod, setPickedPeriod] = useState<string | null>(null);
  const sinceStart = view === SINCE_START;
  // Since the beginning: the running totals are listed per month (table, report)
  // and drawn per day (chart).
  const granularity: Granularity = sinceStart ? "month" : view;

  const periods = useMemo(
    () => buildFinanceByPeriod(dailyRecords, unitCosts, grainsCostByDay, granularity),
    [dailyRecords, unitCosts, grainsCostByDay, granularity],
  );
  const days = useMemo(
    () => (sinceStart ? buildFinanceByPeriod(dailyRecords, unitCosts, grainsCostByDay, "day") : []),
    [sinceStart, dailyRecords, unitCosts, grainsCostByDay],
  );
  const deductions = useMemo(
    () => ({ grainsShareByDate: buildGrainsShareByDate(grainsTotalByDay(grainsCostByDay), dailyRecords) }),
    [grainsCostByDay, dailyRecords],
  );
  const sinceStartTotal = useMemo<PeriodFinance | undefined>(
    () => (sinceStart && periods.length > 0 ? { period: SINCE_START, ...totalFinance(periods) } : undefined),
    [sinceStart, periods],
  );
  const selected = sinceStart ? sinceStartTotal : (periods.find((p) => p.period === pickedPeriod) ?? periods[periods.length - 1]);
  const sellers = useMemo(
    () =>
      selected ? buildSellerFinance(dailyRecords, unitCosts, deductions, granularity, sinceStart ? null : selected.period) : [],
    [dailyRecords, unitCosts, deductions, granularity, sinceStart, selected],
  );
  const label = (p: string) => periodLabel(p, granularity, locale, t);

  if (!selected) return <p className="text-sm text-foreground/70">{t("trend.noData")}</p>;

  const selectedLabel = sinceStart ? sinceStartRange(days, locale, t) : label(selected.period);
  const tablePeriods = sinceStart ? cumulativeFinance(periods) : periods;
  const runningDays = sinceStart ? cumulativeFinance(days) : [];
  const buildTables = () =>
    buildFinanceReport({ label: selectedLabel, figures: selected }, tablePeriods, label, sellers, t, sinceStart);

  return (
    <div className="flex flex-col gap-8 print:gap-5">
      {/* Only on paper: what the printout is and when it was made. */}
      <div className="hidden print:block">
        <p className="text-lg font-semibold">
          {t("header.finance")} · {sinceStart ? selectedLabel : `${viewLabel(view, t)}: ${selectedLabel}`}
        </p>
        <p className="text-xs text-foreground/60">{t("finance.printedAt", { date: generatedAt })}</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="inline-flex self-start rounded-lg border border-foreground/15 p-1">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  setPickedPeriod(null);
                }}
                className={`rounded-md px-3 py-1.5 text-sm sm:px-4 ${
                  view === v ? "bg-foreground/10 font-medium text-foreground" : "text-foreground/70"
                }`}
              >
                {viewLabel(v, t)}
              </button>
            ))}
          </div>
          {sinceStart ? (
            <p className="text-sm text-foreground/70 sm:pb-2">{selectedLabel}</p>
          ) : (
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
          )}
        </div>
        <FinanceExport buildTables={buildTables} fileName={`${t("finance.export.fileName")}-${selected.period}`} t={t} />
      </div>

      <FinanceSummary figures={selected} sinceStart={sinceStart} t={t} />
      <SellerFinanceTable sellers={sellers} t={t} />
      {sinceStart ? (
        <>
          <CumulativeFinanceChart
            title={t("finance.cumulativeChartTitle")}
            periods={runningDays}
            label={(p) => formatDayLabel(p, locale)}
            t={t}
          />
          <PeriodFinanceTable periods={tablePeriods} label={label} t={t} cumulative />
        </>
      ) : (
        <>
          <FinanceChart title={t("finance.chartTitle")} periods={periods} label={label} t={t} kind="incomeExpenses" />
          <FinanceChart title={t("finance.resultChartTitle")} periods={periods} label={label} t={t} kind="result" />
          <PeriodFinanceTable periods={periods} label={label} t={t} />
        </>
      )}
    </div>
  );
}
