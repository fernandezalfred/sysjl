import { formatCurrency } from "@/lib/money/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";

interface LossMarginProps {
  lossMargin: number | null;
  t: TranslateFn;
}

// The Leche y Mote cell's background for a seller who lost the day (anyone below the
// winner); none otherwise.
export function loserBackgroundClass(lossMargin: number | null): string {
  return lossMargin === null ? "" : "rounded-md bg-red-50 dark:bg-red-950/40";
}

// In a losing seller's Leche y Mote cell (admins only): how far behind the day's winner
// they ended.
export function LossMargin({ lossMargin, t }: LossMarginProps) {
  if (lossMargin === null) return null;
  return (
    <div className="mt-1 text-xs font-medium text-red-700 dark:text-red-400">
      {t("cell.lostBy", { margin: formatCurrency(lossMargin) })}
    </div>
  );
}
