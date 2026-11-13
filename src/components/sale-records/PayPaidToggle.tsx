"use client";

import { useTransition } from "react";
import { setRecordPayPaid } from "@/actions/daily-work-records";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/money/pricing";
import { sellerPay } from "@/lib/money/seller-pay";
import { localizeError } from "@/lib/i18n/errors";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow } from "@/types/daily-records";

interface PayPaidToggleProps {
  row: DailyRecordRow;
  t: TranslateFn;
}

// Admin only: the Pago status pill itself is the button — "Pagar" (blue) marks the
// row's seller pay as paid, "✓ Pagado" (green) undoes it, after confirming.
export function PayPaidToggle({ row, t }: PayPaidToggleProps) {
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    const vars = {
      name: row.userName,
      amount: formatCurrency(sellerPay(row.totalSold)),
      date: formatShortDate(row.date, t),
    };
    const markPaid = !row.payPaid;
    if (!(await confirmAlert(t, t(markPaid ? "pay.confirmPaid" : "pay.confirmUnpaid", vars)))) return;

    startTransition(async () => {
      const result = await setRecordPayPaid(row.workRecordId, markPaid);
      if (result.success) successToast(t(markPaid ? "toast.payMarkedPaid" : "toast.payMarkedUnpaid"));
      else errorAlert(t, localizeError(t, result.error ?? ""));
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={row.payPaid ? t("pay.markUnpaid") : t("pay.markPaid")}
      aria-label={row.payPaid ? `${t("pay.paid")}: ${t("pay.markUnpaid")}` : t("pay.markPaid")}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-sm ring-offset-1 ring-offset-background transition hover:ring-2 disabled:opacity-60 ${
        row.payPaid
          ? "bg-emerald-600 text-white hover:ring-emerald-500/50"
          : "bg-sky-600 text-white hover:bg-sky-700 hover:ring-sky-500/50"
      }`}
    >
      {row.payPaid ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3">
          <path d="M5 12l5 5 9-10" />
        </svg>
      ) : null}
      {row.payPaid ? t("pay.paid") : t("pay.pay")}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-2.5 w-2.5 opacity-70">
        <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />
      </svg>
    </button>
  );
}
