"use client";

import { useState } from "react";
import { deletePayAdvance } from "@/actions/pay-advances";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";
import { formatShortDate } from "@/lib/dates";
import { localizeError } from "@/lib/i18n/errors";
import type { TranslateFn } from "@/lib/i18n/translations";
import { formatCurrency } from "@/lib/money/pricing";
import type { PayAdvanceRow, SellerAdvances } from "@/lib/money/pay-advances";

interface AdvanceListProps {
  seller: SellerAdvances;
  onEdit: (advance: PayAdvanceRow) => void;
  t: TranslateFn;
}

// One seller's advances (date, amount, description) with edit and delete, and their total.
export function AdvanceList({ seller, onEdit, t }: AdvanceListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(advance: PayAdvanceRow) {
    const text = t("advances.confirmDelete", { amount: formatCurrency(advance.amount), name: seller.userName });
    if (!(await confirmAlert(t, text, { danger: true }))) return;

    setDeletingId(advance.id);
    const result = await deletePayAdvance(advance.id);
    setDeletingId(null);
    if (result.success) successToast(t("toast.advanceDeleted"));
    else errorAlert(t, localizeError(t, result.error ?? ""));
  }

  if (seller.advances.length === 0) {
    return <p className="py-4 text-sm text-foreground/60">{t("advances.none")}</p>;
  }

  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-foreground/10 text-xs text-foreground/60">
          <tr>
            <th className="px-4 py-2 font-medium sm:px-2">{t("advances.date")}</th>
            <th className="px-2 py-2 text-right font-medium">{t("advances.amountShort")}</th>
            <th className="px-2 py-2 font-medium">{t("advances.description")}</th>
            <th className="px-4 py-2 sm:px-2">
              <span className="sr-only">{t("advances.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/10">
          {seller.advances.map((advance) => (
            <tr key={advance.id}>
              <td className="px-4 py-2 whitespace-nowrap sm:px-2">{formatShortDate(advance.date, t)}</td>
              <td className="px-2 py-2 text-right font-semibold whitespace-nowrap tabular-nums">{formatCurrency(advance.amount)}</td>
              <td className="max-w-48 px-2 py-2 break-words text-foreground/80">{advance.description || "—"}</td>
              <td className="px-4 py-2 sm:px-2">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(advance)}
                    className="min-h-9 rounded-md px-2 text-xs font-medium text-sky-700 hover:bg-sky-500/10 dark:text-sky-300"
                  >
                    {t("advances.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(advance)}
                    disabled={deletingId !== null}
                    className="min-h-9 rounded-md px-2 text-xs font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
                  >
                    {deletingId === advance.id ? t("advances.deleting") : t("advances.delete")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-foreground/15">
          <tr>
            <td className="px-4 py-2 text-xs font-medium text-foreground/60 sm:px-2">{t("advances.totalLabel")}</td>
            <td className="px-2 py-2 text-right font-bold whitespace-nowrap tabular-nums">{formatCurrency(seller.total)}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
