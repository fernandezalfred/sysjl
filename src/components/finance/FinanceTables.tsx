import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/money/pricing";
import { totalFinance, type FinanceFigures, type PeriodFinance, type SellerFinance } from "@/lib/money/finance";
import type { TranslateFn } from "@/lib/i18n/translations";

const TH = "px-3 py-2 font-semibold";
const NUM = "px-3 py-2 text-right whitespace-nowrap tabular-nums";

function resultColor(value: number): string {
  return value < 0 ? "text-red-600 dark:text-red-400" : "text-purple-700 dark:text-purple-400";
}

function TableFrame({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 break-inside-avoid">
      <div>
        <h2 className="text-sm font-semibold text-foreground/80">{title}</h2>
        {hint ? <p className="text-xs text-foreground/60">{hint}</p> : null}
      </div>
      <div className="styled-scroll overflow-x-auto rounded-xl border border-foreground/10 print:overflow-visible">{children}</div>
    </section>
  );
}

// Each seller in the chosen period: days, sales, Ganancia neta, pay and result.
export function SellerFinanceTable({ sellers, t }: { sellers: SellerFinance[]; t: TranslateFn }) {
  return (
    <TableFrame title={t("finance.bySellerTitle")} hint={t("finance.bySellerHint")}>
      <table className="w-full min-w-[36rem] text-sm print:min-w-0">
        <thead className="bg-foreground text-left text-xs uppercase tracking-wide text-background">
          <tr>
            <th className={TH}>{t("table.user")}</th>
            <th className={`${TH} text-right`}>{t("finance.days")}</th>
            <th className={`${TH} text-right`}>{t("finance.sales")}</th>
            <th className={`${TH} text-right`}>{t("finance.netProfit")}</th>
            <th className={`${TH} text-right`}>{t("finance.pay")}</th>
            <th className={`${TH} text-right`}>{t("finance.result")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/10">
          {sellers.map((s) => (
            <tr key={s.userId}>
              <td className="px-3 py-2 font-medium">{s.userName}</td>
              <td className={NUM}>{s.days}</td>
              <td className={NUM}>{formatCurrency(s.sales)}</td>
              <td className={`${NUM} font-semibold`}>{formatCurrency(s.netProfit)}</td>
              <td className={NUM}>{formatCurrency(s.pay)}</td>
              <td className={`${NUM} font-semibold ${resultColor(s.result)}`}>{formatCurrency(s.result)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}

// Every period with income per product, costs, Ganancia neta, pay and result, newest
// first, with a totals row.
export function PeriodFinanceTable({
  periods,
  label,
  t,
}: {
  periods: PeriodFinance[];
  label: (period: string) => string;
  t: TranslateFn;
}) {
  const columns: { key: string; label: string; value: (f: FinanceFigures) => number; strong?: boolean; result?: boolean }[] = [
    { key: "queso", label: t("product.queso"), value: (f) => f.income.queso },
    { key: "yogurt", label: t("product.yogurt"), value: (f) => f.income.yogurt },
    { key: "milkMote", label: t("table.milkMote"), value: (f) => f.income.milkMote },
    { key: "income", label: t("finance.income"), value: (f) => f.income.total, strong: true },
    { key: "costs", label: t("finance.costs"), value: (f) => f.costs.total },
    { key: "netProfit", label: t("finance.netProfit"), value: (f) => f.netProfit, strong: true },
    { key: "pay", label: t("finance.pay"), value: (f) => f.pay },
    { key: "result", label: t("finance.result"), value: (f) => f.result, strong: true, result: true },
  ];
  const total = totalFinance(periods);

  const cell = (c: (typeof columns)[number], f: FinanceFigures, forceStrong = false) => (
    <td
      key={c.key}
      className={`${NUM} ${c.strong || forceStrong ? "font-semibold" : "text-foreground/75"} ${c.result ? resultColor(c.value(f)) : ""}`}
    >
      {formatCurrency(c.value(f))}
    </td>
  );

  return (
    <TableFrame title={t("finance.tableTitle")} hint={t("finance.tableHint")}>
      <table className="w-full min-w-[52rem] text-sm print:min-w-0">
        <thead className="bg-foreground text-left text-xs uppercase tracking-wide text-background">
          <tr>
            <th className={TH}>{t("finance.period")}</th>
            {columns.map((c) => (
              <th key={c.key} className={`${TH} text-right`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/10">
          {[...periods].reverse().map((p) => (
            <tr key={p.period}>
              <td className="px-3 py-2 font-medium whitespace-nowrap">{label(p.period)}</td>
              {columns.map((c) => cell(c, p))}
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-foreground/30 bg-foreground/[0.04]">
          <tr>
            <td className="px-3 py-2 font-semibold">{t("finance.total")}</td>
            {columns.map((c) => cell(c, total, true))}
          </tr>
        </tfoot>
      </table>
    </TableFrame>
  );
}
