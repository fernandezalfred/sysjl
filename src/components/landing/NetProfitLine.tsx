import { LabeledAmount } from "@/components/landing/LabeledAmount";
import { formatCurrency } from "@/lib/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";

interface NetProfitLineProps {
  amount: number;
  t: TranslateFn;
}

// "Ganancia neta: Bs …" in Sale Records and Totals by User, with the amount bold,
// larger and in purple so it stands out (and isn't confused with the winner's green).
// Always one line: in a table the cell widens to fit it; in a Sale Records card the
// .fluid-text sizes shrink it to the card's width instead of wrapping.
// Admin-only: callers render it only when cost data is available.
export function NetProfitLine({ amount, t }: NetProfitLineProps) {
  return (
    <div className="whitespace-nowrap text-xs text-foreground/70">
      <LabeledAmount
        label={t("cell.earned")}
        amount={formatCurrency(amount)}
        amountClassName="text-amount font-bold text-purple-700 dark:text-purple-400"
      />
    </div>
  );
}
