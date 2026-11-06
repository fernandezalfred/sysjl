import { formatCurrency } from "@/lib/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";

interface WinnerBadgeProps {
  isDailyWinner: boolean;
  winnerMargin: number | null;
  // Only admins see the winner's margin; everyone else sees just "Winner".
  isAdmin: boolean;
  t: TranslateFn;
}

// The daily winner label, shown under the Milk & Mote amount in Sale Records and
// Totals by User.
export function WinnerBadge({ isDailyWinner, winnerMargin, isAdmin, t }: WinnerBadgeProps) {
  if (!isDailyWinner) return null;
  return (
    <div className="text-xs font-medium text-green-700 dark:text-green-400">
      {isAdmin && winnerMargin !== null
        ? t("cell.winnerMargin", { margin: formatCurrency(winnerMargin) })
        : t("cell.winner")}
    </div>
  );
}
