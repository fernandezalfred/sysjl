import type { ReactNode } from "react";
import { LabeledAmount } from "@/components/sale-records/LabeledAmount";
import { NetProfitLine } from "@/components/sale-records/NetProfitLine";
import { formatCurrency } from "@/lib/money/pricing";
import { netProfitAfterPay, sellerPay } from "@/lib/money/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";

interface UserCellProps {
  // The seller's name (with any controls next to it, like the card's Edit button).
  name: ReactNode;
  // The record's Total venta (sold revenue), which seller pay is computed from.
  totalSold: number;
  // The record's Ganancia neta; null when the viewer may not see cost data.
  netProfit: number | null;
  // Whether the viewer may see this row's Pago (admins: every row; sellers: their own).
  showPay: boolean;
  // The admin marked this day's pay as paid: the Pago is shown struck through.
  payPaid: boolean;
  t: TranslateFn;
}

const PAY_AMOUNT_CLASS = "text-amount font-semibold text-foreground";
const PAID_AMOUNT_CLASS = "text-amount font-semibold text-foreground/50 line-through";

function payLabel(t: TranslateFn, payPaid: boolean): string {
  return payPaid ? `${t("cell.pay")} (${t("pay.paid")})` : t("cell.pay");
}

// The User cell in Sale Records and Totals by User. With net profit (admins): a
// subtraction written like on paper — Ganancia neta, "−" Pago, a line, and on the last row
// the seller's name on the left and the result in bold purple on the right (label kept as
// tooltip / screen-reader text). Without it: the name, then just the "Pago" line.
// Callers use it for every signed-in viewer on every row (admins get the subtraction,
// sellers the name and, on their own rows, the Pago); guests see only the name.
export function UserCell({ name, totalSold, netProfit, showPay, payPaid, t }: UserCellProps) {
  const pay = sellerPay(totalSold);
  const amountClassName = payPaid ? PAID_AMOUNT_CLASS : PAY_AMOUNT_CLASS;
  if (netProfit === null) {
    return (
      <>
        {name}
        {showPay ? (
          <div className="text-xs font-normal text-foreground/70">
            <LabeledAmount label={payLabel(t, payPaid)} amount={formatCurrency(pay)} amountClassName={amountClassName} />
          </div>
        ) : null}
      </>
    );
  }

  const result = netProfitAfterPay(netProfit, totalSold);
  return (
    <div>
      <NetProfitLine amount={netProfit} t={t} />
      <div className="text-xs font-normal text-foreground/70">
        <LabeledAmount
          label={payLabel(t, payPaid)}
          amount={formatCurrency(pay)}
          amountClassName={amountClassName}
          prefix="−"
        />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">{name}</div>
        <span
          title={t("cell.netProfitAfterPay")}
          aria-label={`${t("cell.netProfitAfterPay")}: ${formatCurrency(result)}`}
          className="text-amount mt-0.5 border-t-2 border-foreground/70 pt-0.5 pl-8 text-right font-bold whitespace-nowrap tabular-nums text-purple-700 dark:text-purple-400"
        >
          {formatCurrency(result)}
        </span>
      </div>
    </div>
  );
}
