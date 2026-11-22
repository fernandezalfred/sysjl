"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { payAllPendingForSeller, undoLastPayment } from "@/actions/daily-work-records";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";
import { localizeError } from "@/lib/i18n/errors";
import { formatCurrency } from "@/lib/money/pricing";
import type { SellerPending } from "@/lib/money/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { ActionState } from "@/types/actions";

interface AdminPendingPayProps {
  sellers: SellerPending[];
  t: TranslateFn;
}

// Admin header: the total still owed to all sellers, always visible on the button; the
// dropdown lists each seller with what they're owed. Full width on phones, a panel
// aligned to the right on wider screens.
export function AdminPendingPay({ sellers, t }: AdminPendingPayProps) {
  const [open, setOpen] = useState(false);
  const [paying, startPaying] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const totalAmount = sellers.reduce((sum, s) => sum + s.amount, 0);
  const owedCount = sellers.filter((s) => s.amount > 0).length;

  function daysLabel(days: number) {
    return days === 1 ? t("pay.dayOne") : t("pay.days", { days });
  }

  async function handlePayAll(seller: SellerPending) {
    const text = t("adminPay.confirmPayAll", {
      name: seller.userName,
      amount: formatCurrency(seller.amount),
      days: daysLabel(seller.days),
    });
    if (!(await confirmAlert(t, text, { danger: true, confirmText: t("adminPay.payDays", { days: daysLabel(seller.days) }) }))) return;
    runAction(() => payAllPendingForSeller(seller.userId), "toast.payAllPaid");
  }

  async function handleUndo(seller: SellerPending) {
    const last = seller.lastPayment;
    if (!last) return;
    const text = t("adminPay.confirmUndo", {
      name: seller.userName,
      amount: formatCurrency(last.amount),
      days: daysLabel(last.days),
    });
    if (!(await confirmAlert(t, text, { confirmText: t("adminPay.undo") }))) return;
    runAction(() => undoLastPayment(seller.userId), "toast.paymentUndone");
  }

  function runAction(action: () => Promise<ActionState>, toastKey: "toast.payAllPaid" | "toast.paymentUndone") {
    startPaying(async () => {
      const result = await action();
      if (result.success) successToast(t(toastKey));
      else errorAlert(t, localizeError(t, result.error ?? ""));
    });
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="admin-pending-pay"
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-3 py-1.5 text-left transition hover:bg-sky-500/10 sm:min-w-56"
      >
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            {t("adminPay.title")}
          </span>
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            <strong className="text-base tabular-nums text-sky-700 dark:text-sky-300">{formatCurrency(totalAmount)}</strong>
            <span className="text-[11px] text-foreground/55">{t("adminPay.sellers", { count: owedCount })}</span>
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`h-4 w-4 flex-shrink-0 text-foreground/60 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          id="admin-pending-pay"
          className="absolute right-0 left-0 z-30 mt-2 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-xl sm:left-auto sm:w-96"
        >
          <p className="border-b border-foreground/10 px-4 py-2.5 text-xs font-medium text-foreground/60">
            {t("adminPay.listHeading")}
          </p>
          {sellers.length === 0 ? (
            <p className="px-4 py-4 text-sm text-foreground/60">{t("adminPay.empty")}</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-foreground/10 overflow-y-auto">
              {sellers.map((seller) => (
                <li key={seller.userId} className="flex flex-col gap-1.5 px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium sm:text-sm">{seller.userName}</span>
                      <span className="block text-[11px] text-foreground/55 sm:text-xs">
                        {seller.amount > 0 ? daysLabel(seller.days) : t("adminPay.upToDate")}
                      </span>
                    </span>
                    {seller.amount > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePayAll(seller)}
                          disabled={paying}
                          className="inline-flex min-h-10 flex-shrink-0 items-center rounded-md bg-red-600 px-2.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-sm ring-1 ring-red-700/20 transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-8 sm:px-3 sm:text-xs"
                        >
                          {t("adminPay.payDays", { days: daysLabel(seller.days) })}
                        </button>
                        <span aria-hidden="true" className="flex-shrink-0 text-base leading-none font-light text-foreground/35 sm:text-lg">
                          =
                        </span>
                      </>
                    ) : null}
                    <strong
                      className={`inline-flex min-w-16 flex-shrink-0 items-center justify-center rounded-lg px-2 py-1 text-xs font-bold sm:min-w-20 sm:px-2.5 sm:py-1.5 sm:text-sm tabular-nums ring-1 ${
                        seller.amount > 0
                          ? "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300"
                          : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400"
                      }`}
                    >
                      {seller.amount > 0 ? formatCurrency(seller.amount) : "✓"}
                    </strong>
                  </div>
                  {seller.amount === 0 && seller.lastPayment ? (
                    <button
                      type="button"
                      onClick={() => handleUndo(seller)}
                      disabled={paying}
                      className="inline-flex min-h-10 items-center gap-1.5 self-start text-left text-[11px] font-medium sm:text-xs text-foreground/60 underline-offset-2 transition hover:text-foreground hover:underline disabled:opacity-60 sm:min-h-0"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0">
                        <path d="M3 7v6h6M3 13a9 9 0 103-6.7L3 9" />
                      </svg>
                      {t("adminPay.undoLastPayment", { amount: formatCurrency(seller.lastPayment.amount), days: daysLabel(seller.lastPayment.days) })}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
