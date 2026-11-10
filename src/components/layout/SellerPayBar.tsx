import { formatCurrency } from "@/lib/money/pricing";
import type { PayTotal } from "@/lib/money/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";

export interface SellerPayTotals {
  earned: PayTotal;
  paid: PayTotal;
  pending: PayTotal;
}

interface SellerPayBarProps {
  totals: SellerPayTotals;
  t: TranslateFn;
}

// Shown to a seller in the panel header instead of the breadcrumbs: pay already
// collected, pay still owed, and their sum (total earned), each with its number of days.
export function SellerPayBar({ totals, t }: SellerPayBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
      <PayCard label={t("pay.collected")} total={totals.paid} accent="paid" t={t} />
      <PayCard label={t("pay.pendingHeading")} total={totals.pending} accent="pending" t={t} />
      <PayCard label={t("pay.totalEarned")} total={totals.earned} accent="earned" t={t} />
    </div>
  );
}

const ACCENTS = {
  paid: { dot: "bg-emerald-500", amount: "text-emerald-700 dark:text-emerald-400" },
  pending: { dot: "bg-amber-500", amount: "text-amber-700 dark:text-amber-400" },
  earned: { dot: "bg-sky-500", amount: "text-sky-700 dark:text-sky-300" },
};

function PayCard({
  label,
  total,
  accent,
  t,
}: {
  label: string;
  total: PayTotal;
  accent: keyof typeof ACCENTS;
  t: TranslateFn;
}) {
  const colors = ACCENTS[accent];
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1.5 sm:min-w-36 sm:px-3">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
        <span className="truncate">{label}</span>
      </span>
      <span className="flex flex-wrap items-baseline justify-between gap-x-2 whitespace-nowrap">
        <strong className={`text-sm tabular-nums sm:text-base ${colors.amount}`}>{formatCurrency(total.amount)}</strong>
        <span className="text-[11px] text-foreground/55">{t("pay.days", { days: total.days })}</span>
      </span>
    </div>
  );
}
