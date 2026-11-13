import { formatCurrency } from "@/lib/money/pricing";
import type { FinanceFigures } from "@/lib/money/finance";
import type { TranslateFn } from "@/lib/i18n/translations";
import { EXPENSES_DOT, INCOME_DOT, RESULT_DOT } from "@/components/finance/FinanceCharts";

// Share bars in 5% steps, written out so Tailwind generates each class (no inline styles).
const BAR_WIDTHS = [
  "w-0", "w-[5%]", "w-[10%]", "w-[15%]", "w-[20%]", "w-[25%]", "w-[30%]", "w-[35%]", "w-[40%]", "w-[45%]", "w-[50%]",
  "w-[55%]", "w-[60%]", "w-[65%]", "w-[70%]", "w-[75%]", "w-[80%]", "w-[85%]", "w-[90%]", "w-[95%]", "w-full",
];

function share(part: number, whole: number): number {
  return whole > 0 ? Math.max(0, Math.min(1, part / whole)) : 0;
}

function percentText(part: number, whole: number): string {
  return `${Math.round(share(part, whole) * 100)}%`;
}

// The chosen period at a glance: five key figures, then income by product and where
// the money went (costs and pay), each line with its share.
export function FinanceSummary({ figures, t }: { figures: FinanceFigures; t: TranslateFn }) {
  const f = figures;
  const tiles = [
    { label: t("finance.income"), value: f.income.total, dot: INCOME_DOT, hint: t("finance.report.records") + `: ${f.records}` },
    { label: t("finance.costs"), value: f.costs.total, dot: EXPENSES_DOT, hint: t("finance.ofIncome", { percent: percentText(f.costs.total, f.income.total) }) },
    { label: t("finance.netProfit"), value: f.netProfit, dot: RESULT_DOT, hint: t("finance.netProfitHint"), accent: true },
    { label: t("finance.pay"), value: f.pay, dot: EXPENSES_DOT, hint: t("finance.ofIncome", { percent: percentText(f.pay, f.income.total) }) },
    { label: t("finance.result"), value: f.result, dot: RESULT_DOT, hint: t("finance.resultHint"), accent: true },
  ];

  const incomeLines = [
    {
      label: t("product.queso"),
      value: f.income.queso,
      detail: t("finance.unitsDetail", { taken: f.units.quesoTaken, sold: f.units.queso, left: f.units.quesoRemaining }),
    },
    {
      label: t("product.yogurt"),
      value: f.income.yogurt,
      detail: t("finance.unitsDetail", { taken: f.units.yogurtTaken, sold: f.units.yogurt, left: f.units.yogurtRemaining }),
    },
    { label: t("table.milkMote"), value: f.income.milkMote, detail: "" },
  ];
  const outLines = [
    { label: t("finance.costQueso"), value: f.costs.queso, detail: "" },
    { label: t("finance.costYogurt"), value: f.costs.yogurt, detail: "" },
    { label: t("finance.milk"), value: f.costs.milk, detail: t("finance.liters", { count: f.units.milkLiters }) },
    { label: t("header.grains"), value: f.costs.grains, detail: "" },
    { label: t("finance.pay"), value: f.pay, detail: "" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((tile, index) => (
          <div
            key={tile.label}
            className={`rounded-xl border p-4 break-inside-avoid ${
              tile.accent ? "border-purple-500/30 bg-purple-500/[0.05]" : "border-foreground/10 bg-foreground/[0.02]"
            } ${index === tiles.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}
          >
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${tile.dot}`} />
              {tile.label}
            </dt>
            <dd
              className={`mt-1 text-xl font-bold tracking-tight tabular-nums sm:text-2xl ${
                tile.value < 0 ? "text-red-600 dark:text-red-400" : tile.accent ? "text-purple-700 dark:text-purple-400" : ""
              }`}
            >
              {formatCurrency(tile.value)}
            </dd>
            <dd className="text-xs text-foreground/55">{tile.hint}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title={t("finance.incomeByProduct")}
          total={f.income.total}
          lines={incomeLines}
          barClass={INCOME_DOT}
          totalLabel={t("finance.totalSold")}
          t={t}
        />
        <BreakdownCard title={t("finance.costsBreakdown")} total={f.income.total} lines={outLines} barClass={EXPENSES_DOT} t={t} />
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  total,
  lines,
  barClass,
  totalLabel,
  t,
}: {
  title: string;
  total: number;
  lines: { label: string; value: number; detail: string }[];
  barClass: string;
  // A closing row with the sum of the lines (the sold total of every product).
  totalLabel?: string;
  t: TranslateFn;
}) {
  return (
    <section className="rounded-xl border border-foreground/10 p-4 break-inside-avoid">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-foreground/55">{t("finance.ofIncome", { percent: "%" })}</span>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="font-medium">{line.label}</span>
                {line.detail ? <span className="block text-xs text-foreground/55 sm:ml-2 sm:inline">{line.detail}</span> : null}
              </span>
              <span className="flex items-baseline gap-2 whitespace-nowrap">
                <strong className="tabular-nums">{formatCurrency(line.value)}</strong>
                <span className="w-9 text-right text-xs text-foreground/55 tabular-nums">{percentText(line.value, total)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div className={`h-full rounded-full ${barClass} ${BAR_WIDTHS[Math.round(share(line.value, total) * 20)]}`} />
            </div>
          </li>
        ))}
      </ul>
      {totalLabel ? (
        <div className="mt-4 flex items-baseline justify-between gap-3 border-t-2 border-foreground/20 pt-3 text-sm">
          <span className="font-semibold">{totalLabel}</span>
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            <strong className="text-base tabular-nums">{formatCurrency(lines.reduce((sum, l) => sum + l.value, 0))}</strong>
            <span className="w-9 text-right text-xs text-foreground/55 tabular-nums">100%</span>
          </span>
        </div>
      ) : null}
    </section>
  );
}
