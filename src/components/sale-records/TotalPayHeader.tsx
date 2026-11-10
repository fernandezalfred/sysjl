import { formatCurrency } from "@/lib/money/pricing";
import type { PayTotal } from "@/lib/money/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";

interface TotalPayHeaderProps {
  // The seller's pay over every day they worked; null when the viewer isn't a seller.
  total: PayTotal | null;
  t: TranslateFn;
}

// The Edit column's header (pinned while scrolling): a seller's total earned pay.
export function TotalPayHeader({ total, t }: TotalPayHeaderProps) {
  return (
    <th className="sticky top-[var(--sticky-offset,0px)] z-10 bg-foreground px-4 py-2 text-right font-semibold">
      {total ? (
        <div className="flex flex-col items-end text-[10px] leading-tight tracking-normal">
          <span className="whitespace-nowrap">{t("pay.totalEarned")}</span>
          <span className="text-xs whitespace-nowrap tabular-nums">{formatCurrency(total.amount)}</span>
          <span className="font-normal normal-case opacity-80 whitespace-nowrap">
            {t("pay.daysWorked", { days: total.days })}
          </span>
        </div>
      ) : null}
    </th>
  );
}
