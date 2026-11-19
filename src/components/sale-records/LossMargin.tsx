import { formatCurrency } from "@/lib/money/pricing";

interface LossMarginProps {
  lossMargin: number | null;
}

// The Leche y Mote cell's background for a seller who lost the day (anyone below the
// winner); none otherwise.
export function loserBackgroundClass(isDailyLoser: boolean): string {
  return isDailyLoser ? "rounded-md bg-red-50 dark:bg-red-950/40" : "";
}

// In a losing seller's Leche y Mote cell (admins only): how far behind the day's winner
// they ended, as a negative amount ("-Bs 120").
export function LossMargin({ lossMargin }: LossMarginProps) {
  if (lossMargin === null) return null;
  return (
    <div className="mt-1 text-xs font-medium text-red-700 dark:text-red-400">
      {formatCurrency(-lossMargin)}
    </div>
  );
}
