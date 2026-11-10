"use client";

import { useState, useTransition } from "react";
import { setRecordPayPaid } from "@/actions/daily-work-records";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/money/pricing";
import { sellerPay } from "@/lib/money/seller-pay";
import { localizeError } from "@/lib/i18n/errors";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow } from "@/types/daily-records";

interface PayPaidToggleProps {
  row: DailyRecordRow;
  t: TranslateFn;
}

// Admin only: marks the row's seller pay as paid (or undoes it), after confirming.
export function PayPaidToggle({ row, t }: PayPaidToggleProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function handleClick() {
    const vars = {
      name: row.userName,
      amount: formatCurrency(sellerPay(row.totalSold)),
      date: formatShortDate(row.date),
    };
    if (!window.confirm(t(row.payPaid ? "pay.confirmUnpaid" : "pay.confirmPaid", vars))) return;

    setError(undefined);
    startTransition(async () => {
      const result = await setRecordPayPaid(row.workRecordId, !row.payPaid);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`text-xs font-medium underline-offset-2 hover:underline disabled:opacity-60 ${
          row.payPaid ? "text-foreground/60" : "text-green-700 dark:text-green-400"
        }`}
      >
        {row.payPaid ? t("pay.markUnpaid") : t("pay.markPaid")}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {localizeError(t, error)}
        </p>
      ) : null}
    </div>
  );
}
