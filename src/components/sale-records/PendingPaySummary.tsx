import { formatCurrency } from "@/lib/money/pricing";
import { pendingSellerPay } from "@/lib/money/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow } from "@/types/daily-records";

interface PendingPaySummaryProps {
  dailyRecords: DailyRecordRow[];
  userId: string;
  t: TranslateFn;
}

// A seller's own pay still owed, over every day the admin hasn't marked as paid.
export function PendingPaySummary({ dailyRecords, userId, t }: PendingPaySummaryProps) {
  const { amount, days } = pendingSellerPay(dailyRecords, userId);

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-foreground/15 bg-foreground/[0.03] px-4 py-3">
      <p className="text-sm font-medium">{t("pay.pendingHeading")}</p>
      {days === 0 ? (
        <p className="text-sm text-foreground/70">{t("pay.noPending")}</p>
      ) : (
        <div className="text-right">
          <p className="text-amount font-bold tabular-nums">{formatCurrency(amount)}</p>
          <p className="text-xs text-foreground/70">{t("pay.pendingDays", { days })}</p>
        </div>
      )}
    </div>
  );
}
