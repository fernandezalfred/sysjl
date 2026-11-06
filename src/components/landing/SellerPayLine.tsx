import type { ReactNode } from "react";
import { LabeledAmount } from "@/components/landing/LabeledAmount";
import { NetProfitLine } from "@/components/landing/NetProfitLine";
import { formatCurrency } from "@/lib/pricing";
import { netProfitAfterPay, sellerPay } from "@/lib/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";

interface SellerPayLineProps {
  // The seller's name (with any controls next to it, like the card's Edit button).
  name: ReactNode;
  // The record's Total venta (sold revenue), which seller pay is computed from.
  totalSold: number;
  // The record's Ganancia neta; null when the viewer may not see cost data.
  netProfit: number | null;
  t: TranslateFn;
}

// The User cell in Sale Records and Totals by User. With net profit (admins): a
// subtraction written like on paper — Ganancia neta, "−" Pago, a line, and on the last row
// the seller's name on the left and the result in bold purple on the right (label kept as
// tooltip / screen-reader text). Without it: the name, then just the "Pago" line.
// Callers use it for admins on every row and for a seller on their own rows only.
export function SellerPayLine({ name, totalSold, netProfit, t }: SellerPayLineProps) {
  const pay = sellerPay(totalSold);
  if (netProfit === null) {
    return (
      <>
        {name}
        <div className="text-xs font-normal text-foreground/70">
          <LabeledAmount label={t("cell.pay")} amount={formatCurrency(pay)} />
        </div>
      </>
    );
  }

  const result = netProfitAfterPay(netProfit, totalSold);
  return (
    <div>
      <NetProfitLine amount={netProfit} t={t} />
      <div className="text-xs font-normal text-foreground/70">
        <LabeledAmount label={t("cell.pay")} amount={formatCurrency(pay)} prefix="−" />
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
