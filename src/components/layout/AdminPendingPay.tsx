"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { payAllPendingForSeller, undoLastPayment } from "@/actions/daily-work-records";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";
import { localizeError } from "@/lib/i18n/errors";
import { formatAmount, formatCurrency } from "@/lib/money/pricing";
import type { SellerPending } from "@/lib/money/seller-pay";
import type { SellerAdvances } from "@/lib/money/pay-advances";
import { AdvancesModal, type AdvancesModalHandle } from "@/components/layout/advances/AdvancesModal";
import { totalAdvances } from "@/lib/money/pay-advances";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { ActionState } from "@/types/actions";

interface AdminPendingPayProps {
  sellers: SellerPending[];
  // Each seller's advances: added, listed and edited from here (icons on each row and
  // in the header), and the "Descontar" badge on their row.
  advances: SellerAdvances[];
  t: TranslateFn;
}

// Admin header: the total still owed to all sellers, always visible on the button; the
// dropdown lists each seller with what they're owed, and manages their advances (add,
// view / edit / delete in a modal, deduct from the payment). Full width on phones, a
// panel aligned to the right on wider screens.
export function AdminPendingPay({ sellers, advances, t }: AdminPendingPayProps) {
  const [open, setOpen] = useState(false);
  const [paying, startPaying] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const advancesModal = useRef<AdvancesModalHandle>(null);
  const advancesTotal = totalAdvances(advances);
  const canAddAdvance = advances.some((a) => a.active);
  const totalAmount = sellers.reduce((sum, s) => sum + s.amount, 0);
  const owedCount = sellers.filter((s) => s.days > 0).length;

  function advancesOf(userId: string) {
    return advances.find((a) => a.userId === userId && a.total > 0);
  }

  function daysLabel(days: number) {
    return days === 1 ? t("pay.dayOne") : t("pay.days", { days });
  }

  // Paying the days also pays off the seller's listed advances: the confirmation
  // shows what's handed over (Pago minus advances).
  async function handlePayAll(seller: SellerPending) {
    const advance = advancesOf(seller.userId);
    const vars = { name: seller.userName, days: daysLabel(seller.days) };
    const text = advance
      ? t("adminPay.confirmPayAllWithAdvance", {
          ...vars,
          amount: formatCurrency(seller.amount - advance.total),
          advance: formatCurrency(advance.total),
        })
      : t("adminPay.confirmPayAll", { ...vars, amount: formatCurrency(seller.amount) });
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
          className="absolute right-0 left-0 z-30 mt-2 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-xl sm:left-auto sm:w-max sm:min-w-80 sm:max-w-[30rem]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-foreground/10 py-1.5 pr-2 pl-3 sm:pl-4">
            <p className="min-w-0 truncate text-xs font-medium text-foreground/60">{t("adminPay.listHeading")}</p>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <span className="text-[11px] whitespace-nowrap text-foreground/55 sm:text-xs">
                {t("advances.title")}:{" "}
                <strong className="tabular-nums text-amber-700 dark:text-amber-300">{formatCurrency(advancesTotal)}</strong>
              </span>
              <IconButton
                label={t("advances.add")}
                onClick={() => advancesModal.current?.show({ kind: "create" })}
                disabled={!canAddAdvance}
                tone="amber"
              >
                <path d="M12 5v14M5 12h14" />
              </IconButton>
            </div>
          </div>
          {sellers.length === 0 ? (
            <p className="px-4 py-4 text-sm text-foreground/60">{t("adminPay.empty")}</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-foreground/10 overflow-y-auto">
              {sellers.map((seller) => (
                <li key={seller.userId} className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                  {/* Name, pay button, "=" and amount packed together, no gaps between them. */}
                  <div className="min-w-0">
                    {/* The whole name (wrapping if it's long, never cut), then the advance icons. */}
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="min-w-0 text-[13px] leading-snug font-medium break-words sm:text-sm">{seller.userName}</span>
                      <SellerAdvanceIcons
                        seller={advances.find((a) => a.userId === seller.userId)}
                        onAdd={(userId) => advancesModal.current?.show({ kind: "create", userId })}
                        onView={(userId) => advancesModal.current?.show({ kind: "list", userId })}
                        t={t}
                      />
                    </div>
                    {/* Second line: the days owed (and the advances), or once up to date the
                        undo of their last payment in place of "Al día" (not once they have a
                        pending advance: that closes the last payment). */}
                    <div className="flex min-w-0 items-center">
                      {seller.days === 0 && seller.lastPayment && !advancesOf(seller.userId) ? (
                        <button
                          type="button"
                          onClick={() => handleUndo(seller)}
                          disabled={paying}
                          className="-mx-1 flex min-w-0 items-center gap-1 rounded px-1 py-1 text-left text-[11px] font-medium text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground disabled:opacity-60 sm:py-0.5 sm:text-xs"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3 flex-shrink-0">
                            <path d="M3 7v6h6M3 13a9 9 0 103-6.7L3 9" />
                          </svg>
                          <span className="truncate">
                            {t("adminPay.undoLastPayment", { amount: formatCurrency(seller.lastPayment.amount), days: daysLabel(seller.lastPayment.days) })}
                          </span>
                        </button>
                      ) : (
                        <span className="min-w-0 truncate text-[11px] text-foreground/55 sm:text-xs">
                          {seller.days > 0 ? daysLabel(seller.days) : t("adminPay.upToDate")}
                          {advancesOf(seller.userId) ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              {" · "}
                              {t("adminPay.advanceNote", { amount: formatCurrency(advancesOf(seller.userId)?.total ?? 0) })}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </div>
                  </div>
                  {seller.days > 0 ? (
                    <button
                      type="button"
                      onClick={() => handlePayAll(seller)}
                      disabled={paying}
                      aria-label={t("adminPay.payDays", { days: daysLabel(seller.days) })}
                      title={t("adminPay.payDays", { days: daysLabel(seller.days) })}
                      className="inline-flex min-h-10 flex-shrink-0 items-center rounded-md bg-red-600 px-2.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-sm ring-1 ring-red-700/20 transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-8 sm:px-3 sm:text-xs"
                    >
                      {/* Just "Pagar"; the days are on the line below and in its tooltip. */}
                      {t("pay.pay")}
                    </button>
                  ) : null}
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    {seller.days > 0 ? (
                      <span aria-hidden="true" className="text-sm leading-none font-light text-foreground/35">
                        =
                      </span>
                    ) : null}
                    <PayAmount owed={seller.days > 0 ? seller.amount : null} advance={advancesOf(seller.userId)?.total ?? 0} t={t} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Outside the dropdown, so it stays mounted while the modal is open. */}
      <AdvancesModal ref={advancesModal} sellers={advances} t={t} />
    </div>
  );
}

interface PayAmountProps {
  // The seller's unpaid Pago; null when they're up to date.
  owed: number | null;
  // Their listed advances (0 when none), taken off when the days are paid.
  advance: number;
  t: TranslateFn;
}

// The row's amount, the same badge on every row so they line up and none looks empty:
// "350 − 200 = 150 Bs" (owed, advance in amber, what's handed over), or with no advance
// "350 − 0 = 350 Bs" with a muted 0. "Bs" only after the final amount; each sign in a
// small circle centered on the seam between two colors. "✓" once up to date.
function PayAmount({ owed, advance, t }: PayAmountProps) {
  if (owed === null) {
    return (
      <strong className="inline-flex min-w-12 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 px-2 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-500/25 sm:min-w-14 dark:text-emerald-400">
        ✓
      </strong>
    );
  }
  return (
    <span className="inline-flex flex-shrink-0 items-stretch overflow-hidden rounded-md text-[13px] font-semibold whitespace-nowrap tabular-nums ring-1 ring-sky-500/25 sm:text-sm">
      <span className="flex items-center bg-sky-500/10 py-1 pr-3 pl-2 text-sky-700 dark:text-sky-300">{formatAmount(owed)}</span>
      <SeamSign sign="−" />
      {advance > 0 ? (
        <span
          title={t("adminPay.advanceNote", { amount: formatCurrency(advance) })}
          className="flex items-center bg-amber-500/15 px-3 text-amber-700 dark:text-amber-300"
        >
          {formatAmount(advance)}
        </span>
      ) : (
        <span title={t("adminPay.noAdvance")} className="flex items-center bg-foreground/[0.04] px-3 text-foreground/35">
          0
        </span>
      )}
      <SeamSign sign="=" />
      <strong className="flex items-center bg-sky-600 py-1 pr-2 pl-3 text-sm font-bold text-white sm:text-[15px]">
        {formatAmount(owed - advance)}
        <BsSuffix />
      </strong>
    </span>
  );
}

// "Bs" after the final amount ("150 Bs"), slightly smaller than the number.
function BsSuffix() {
  return <span className="ml-0.5 text-[0.85em] font-semibold opacity-80">Bs</span>;
}

// A "−" or "=" in a small circle straddling the border between two colored parts of
// the amount badge (half over each).
function SeamSign({ sign }: { sign: string }) {
  return (
    <span
      className="relative z-10 -mx-2.5 flex h-5 w-5 flex-shrink-0 items-center justify-center self-center rounded-full bg-background text-xs leading-none font-bold text-foreground/60 shadow-sm ring-1 ring-foreground/15"
    >
      {sign}
    </span>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone: "amber" | "neutral";
  // Shown in a small bubble on the icon (e.g. how many advances).
  count?: number;
  children: ReactNode;
}

// A small square icon button; the label is its tooltip and accessible name.
function IconButton({ label, onClick, disabled, tone, count, children }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40 sm:h-7 sm:w-7 ${
        tone === "amber"
          ? "text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
          : "text-foreground/55 hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        {children}
      </svg>
      {count ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-600 px-0.5 text-[9px] leading-none font-bold text-white tabular-nums">
          {count}
        </span>
      ) : null}
    </button>
  );
}

interface SellerAdvanceIconsProps {
  // The seller's advances entry; undefined for someone who can't get advances (not a
  // current seller and none on record).
  seller: SellerAdvances | undefined;
  onAdd: (userId: string) => void;
  onView: (userId: string) => void;
  t: TranslateFn;
}

// Next to a seller's name: add an advance, and view their advances (with how many).
function SellerAdvanceIcons({ seller, onAdd, onView, t }: SellerAdvanceIconsProps) {
  if (!seller) return null;
  const count = seller.advances.length;
  return (
    <span className="flex flex-shrink-0 items-center">
      {seller.active ? (
        <IconButton label={t("advances.add")} onClick={() => onAdd(seller.userId)} tone="amber">
          <path d="M12 5v14M5 12h14" />
        </IconButton>
      ) : null}
      {count > 0 ? (
        <IconButton label={t("advances.modalTitle", { name: seller.userName })} onClick={() => onView(seller.userId)} tone="neutral" count={count}>
          <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
        </IconButton>
      ) : null}
    </span>
  );
}
