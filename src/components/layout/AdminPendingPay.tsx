"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/money/pricing";
import type { SellerPending } from "@/lib/money/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";

interface AdminPendingPayProps {
  sellers: SellerPending[];
  t: TranslateFn;
}

// Admin header: the total still owed to all sellers, always visible on the button; the
// dropdown lists each seller with what they're owed. Full width on phones, a panel
// aligned to the right on wider screens.
export function AdminPendingPay({ sellers, t }: AdminPendingPayProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const totalAmount = sellers.reduce((sum, s) => sum + s.amount, 0);
  const owedCount = sellers.filter((s) => s.amount > 0).length;

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
          className="absolute right-0 left-0 z-30 mt-2 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-xl sm:left-auto sm:w-80"
        >
          <p className="border-b border-foreground/10 px-4 py-2.5 text-xs font-medium text-foreground/60">
            {t("adminPay.listHeading")}
          </p>
          {sellers.length === 0 ? (
            <p className="px-4 py-4 text-sm text-foreground/60">{t("adminPay.empty")}</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-foreground/10 overflow-y-auto">
              {sellers.map((seller) => (
                <li key={seller.userId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{seller.userName}</span>
                    <span className="block text-xs text-foreground/55">
                      {seller.amount > 0 ? t("pay.days", { days: seller.days }) : t("adminPay.upToDate")}
                    </span>
                  </span>
                  <strong
                    className={`text-sm tabular-nums ${
                      seller.amount > 0 ? "text-sky-700 dark:text-sky-300" : "text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {seller.amount > 0 ? formatCurrency(seller.amount) : "✓"}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
