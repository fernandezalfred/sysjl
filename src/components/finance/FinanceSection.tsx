"use client";

import { useMemo, useState } from "react";
import { buildEqualDaysComparison, buildNetProfitByPeriod, buildPeriodTotals } from "@/lib/money/seller-comparison";
import type { GrainsDeductions, UnitCosts } from "@/lib/money/revenue";
import type { Granularity } from "@/lib/date-buckets";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow } from "@/types/daily-records";
import { formatDayLabel, formatMonthLabel } from "@/components/sales-charts/chart-theme";
import { useHideOnScrollDown } from "@/hooks/useHideOnScrollDown";
import { SellerComparisonChart } from "@/components/finance/SellerComparisonChart";
import { SellerComparisonBarChart } from "@/components/finance/SellerComparisonBarChart";
import { NetProfitChart } from "@/components/finance/NetProfitChart";
import { PeriodTotalsBoxes } from "@/components/finance/PeriodTotalsBoxes";

// Día / Semana / Mes pick one period; "all" is every record since the first sale.
type FinanceView = Granularity | "all";
const VIEWS: FinanceView[] = ["day", "week", "month", "all"];

function periodLabel(period: string, granularity: Granularity, locale: Locale, t: TranslateFn): string {
  if (granularity === "month") return formatMonthLabel(period, locale);
  if (granularity === "week") return t("trend.weekOf", { date: formatDayLabel(period, locale) });
  return formatDayLabel(period, locale);
}

interface FinanceSectionProps {
  dailyRecords: DailyRecordRow[];
  unitCosts: UnitCosts;
  deductions: GrainsDeductions;
  locale: Locale;
}

// Admin only: every seller compared over the same number of days worked (for bonuses)
// in the chosen day, week, month or since the beginning, and the company's total Neto
// per period.
export function FinanceSection({ dailyRecords, unitCosts, deductions, locale }: FinanceSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [view, setView] = useState<FinanceView>("day");
  const [pickedPeriod, setPickedPeriod] = useState<string | null>(null);
  const toolbarHidden = useHideOnScrollDown();
  const sinceStart = view === "all";
  // Since the beginning: the Neto chart is drawn per month.
  const granularity: Granularity = sinceStart ? "month" : view;

  const periods = useMemo(
    () => buildNetProfitByPeriod(dailyRecords, unitCosts, deductions, granularity),
    [dailyRecords, unitCosts, deductions, granularity],
  );
  const selected = periods.find((p) => p.period === pickedPeriod)?.period ?? periods[periods.length - 1]?.period;
  const comparison = useMemo(
    () => buildEqualDaysComparison(dailyRecords, unitCosts, deductions, granularity, sinceStart ? null : (selected ?? null)),
    [dailyRecords, unitCosts, deductions, granularity, sinceStart, selected],
  );
  const totals = useMemo(
    () => buildPeriodTotals(dailyRecords, unitCosts, deductions, granularity, sinceStart ? null : (selected ?? null)),
    [dailyRecords, unitCosts, deductions, granularity, sinceStart, selected],
  );
  // Sellers by name: the order that gives each one their color.
  const sellerOrder = useMemo(() => {
    const names = new Map(dailyRecords.map((r) => [r.userId, r.userName]));
    return [...names.keys()].sort((a, b) => names.get(a)!.localeCompare(names.get(b)!));
  }, [dailyRecords]);
  const label = (p: string) => periodLabel(p, granularity, locale, t);

  if (!selected) return <p className="text-sm text-foreground/70">{t("trend.noData")}</p>;

  const periodText = sinceStart ? t("finance.sinceStart") : label(selected);

  return (
    <div className="flex flex-col gap-6">
      {/* Pinned under the panel's top bar; slides away while scrolling down the page and
          comes back on scrolling up. */}
      <div
        className={`sticky top-[calc(var(--sticky-offset,0px)+0.5rem)] z-10 transition-[translate,opacity] duration-300 ease-out ${
          toolbarHidden ? "pointer-events-none -translate-y-[calc(100%+var(--sticky-offset,0px)+1rem)] opacity-0" : ""
        } flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-background/90 p-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:items-center sm:justify-between sm:p-4`}
      >
        <div role="group" aria-label={t("finance.view")} className="grid grid-cols-4 gap-1 rounded-xl bg-foreground/[0.06] p-1 sm:inline-flex">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                setPickedPeriod(null);
              }}
              className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:px-4 ${
                view === v
                  ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                  : "text-foreground/65 hover:text-foreground"
              }`}
            >
              {v === "all" ? t("finance.sinceStart") : t(`trend.${v}`)}
            </button>
          ))}
        </div>
        {sinceStart ? (
          <p className="text-sm text-foreground/70">{t("finance.sinceStartHint")}</p>
        ) : (
          <label className="flex items-center gap-2 text-sm font-medium text-foreground/70">
            {t("finance.period")}
            <select
              value={selected}
              onChange={(event) => setPickedPeriod(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-base text-foreground shadow-sm sm:flex-none sm:text-sm"
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

      <PeriodTotalsBoxes totals={totals} sellerOrder={sellerOrder} periodLabel={periodText} t={t} />

      {comparison.sellers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/65">
          {t("finance.noRecords")}
        </p>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
            <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 px-2 text-sm font-semibold tabular-nums text-violet-700 dark:text-violet-300">
              {comparison.days}
            </span>
            <div>
              <p className="text-sm font-semibold">{t("finance.bonusTitle")}</p>
              <p className="text-sm text-foreground/70">{t("finance.comparisonHint", { days: comparison.days })}</p>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <SellerComparisonBarChart comparison={comparison} sellerOrder={sellerOrder} t={t} />
            <SellerComparisonChart
              comparison={comparison}
              sellerOrder={sellerOrder}
              dayLabel={(date) => formatDayLabel(date, locale)}
              t={t}
            />
          </div>
        </>
      )}
      <NetProfitChart periods={periods} label={label} t={t} />
    </div>
  );
}
