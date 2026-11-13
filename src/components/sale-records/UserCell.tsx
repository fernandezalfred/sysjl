import type { ReactNode } from "react";
import { NetProfitLine } from "@/components/sale-records/NetProfitLine";
import { formatCurrency } from "@/lib/money/pricing";
import { netProfitAfterPay, sellerPay } from "@/lib/money/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";

interface UserCellProps {
  // The seller's name (with any controls next to it, like the card's Edit button).
  name: ReactNode;
  // The record's Total venta (sold revenue), which seller pay is computed from.
  totalSold: number;
  // The record's Neto; null when the viewer may not see cost data.
  netProfit: number | null;
  // Whether the viewer may see this row's Pago (admins: every row; sellers: their own).
  showPay: boolean;
  // The admin marked this day's pay as paid: green "Pagado", otherwise amber "Por cobrar".
  payPaid: boolean;
  // Admins: the clickable status pill that marks the pay as paid / not paid (replaces
  // the plain pill in the Pago line).
  payToggle?: ReactNode;
  t: TranslateFn;
}

// The User cell in Sale Records and Totals by User. With net profit (admins): a
// subtraction written like on paper — Neto, "−" Pago, a line, and on the last row
// the seller's name on the left and the result in bold purple on the right (label kept as
// tooltip / screen-reader text). Without it: the name, then just the "Pago" line.
// Callers use it for every signed-in viewer on every row (admins get the subtraction,
// sellers the name and, on their own rows, the Pago); guests see only the name.
export function UserCell({ name, totalSold, netProfit, showPay, payPaid, payToggle, t }: UserCellProps) {
  const pay = sellerPay(totalSold);
  if (netProfit === null) {
    return (
      <>
        {name}
        {showPay ? <SellerPayBadge amount={pay} paid={payPaid} t={t} /> : null}
      </>
    );
  }

  const result = netProfitAfterPay(netProfit, totalSold);
  return (
    <div>
      <NetProfitLine amount={netProfit} t={t} />
      <div className="flex items-center justify-between gap-3 whitespace-nowrap text-xs font-normal text-foreground/70">
        <span className="flex items-center gap-1.5">
          {t("cell.pay")}
          {payToggle ?? <PayStatusPill paid={payPaid} t={t} />}
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-amount font-bold text-foreground/70">−</span>
          <strong
            className={`text-amount font-semibold tabular-nums ${
              payPaid ? "text-emerald-700 line-through dark:text-emerald-400" : "text-sky-700 dark:text-sky-400"
            }`}
          >
            {formatCurrency(pay)}
          </strong>
        </span>
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

// A seller's own Pago for the day, as a colored badge: green with a check once the admin
// marked it paid, amber while it's still owed.
function SellerPayBadge({ amount, paid, t }: { amount: number; paid: boolean; t: TranslateFn }) {
  const tone = paid
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
    : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300";

  return (
    <div className={`mt-1.5 inline-flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 ${tone}`}>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{t("cell.pay")}</span>
        <strong className="text-base font-bold tabular-nums">{formatCurrency(amount)}</strong>
      </span>
      <PayStatusPill paid={paid} t={t} />
    </div>
  );
}

// "✓ Pagado" (green) or "Por cobrar" (amber), next to a Pago amount.
function PayStatusPill({ paid, t }: { paid: boolean; t: TranslateFn }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        paid ? "bg-emerald-600 text-white" : "bg-amber-500 text-amber-950"
      }`}
    >
      {paid ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3">
          <path d="M5 12l5 5 9-10" />
        </svg>
      ) : null}
      {paid ? t("pay.paid") : t("pay.pending")}
    </span>
  );
}
