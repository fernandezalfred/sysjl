import { LabeledAmount } from "@/components/sale-records/LabeledAmount";
import { formatCurrency } from "@/lib/money/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";

interface NetProfitLineProps {
  amount: number;
  t: TranslateFn;
}

// "Neto … Bs", the first line of the subtraction under the seller's name
// (UserCell) in Sale Records and Totals by User; bold in the regular text color, since
// the purple highlight goes to the result. Always one line: in a table the User cell
// widens to fit it; in a Sale Records card the .fluid-text sizes shrink it instead.
// Admin-only: callers render it only when cost data is available.
export function NetProfitLine({ amount, t }: NetProfitLineProps) {
  return (
    <div className="whitespace-nowrap text-xs text-foreground/70">
      <LabeledAmount label={t("cell.earned")} amount={formatCurrency(amount)} />
    </div>
  );
}
