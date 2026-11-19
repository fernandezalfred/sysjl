"use client";

import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/money/pricing";
import type { PeriodTotals } from "@/lib/money/seller-comparison";
import type { TranslateFn } from "@/lib/i18n/translations";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { userColor } from "@/components/sales-charts/chart-theme";
import { daysText } from "@/components/finance/FinanceCard";

type SellerTotals = PeriodTotals["bySeller"][number];

interface PeriodTotalsBoxesProps {
  totals: PeriodTotals;
  // Every seller's id in a fixed order: each one keeps the same color as in the charts.
  sellerOrder: string[];
  // "12 nov", "Semana del 9 nov", "noviembre de 2026" or "Desde el inicio".
  periodLabel: string;
  // "en esta semana": the view the totals cover.
  scope: string;
  t: TranslateFn;
}

// The chosen period's two totals over every seller's records: what the workers earned
// (their Pago, paid or not) and the company's net profit after it (Neto − Pago), each
// with what every worker accounts for, largest first, and a bar of their share.
export function PeriodTotalsBoxes({ totals, sellerOrder, periodLabel, scope, t }: PeriodTotalsBoxesProps) {
  const mode = useIsDarkMode() ? "dark" : "light";
  const colorOf = (userId: string) => userColor(Math.max(0, sellerOrder.indexOf(userId)), mode);
  const byResult = [...totals.bySeller].sort((a, b) => b.result - a.result || a.userName.localeCompare(b.userName));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <TotalCard
        tone="pay"
        icon="M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.8 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3"
        label={t("finance.workersPay")}
        amount={totals.pay}
        hint={t("finance.workersPayHint", {
          scope,
          records: totals.records === 1 ? t("finance.recordOne") : t("finance.recordsCount", { count: totals.records }),
        })}
        periodLabel={periodLabel}
      >
        <SellerList sellers={totals.bySeller} amount={(s) => s.pay} colorOf={colorOf} scope={scope} t={t} />
      </TotalCard>
      <TotalCard
        tone="net"
        icon="M3 17l6-6 4 4 8-8M15 7h6v6"
        label={t("finance.netAfterPay")}
        amount={totals.result}
        hint={t("finance.netAfterPayHint", { scope })}
        periodLabel={periodLabel}
      >
        <SellerList sellers={byResult} amount={(s) => s.result} colorOf={colorOf} scope={scope} signed t={t} />
      </TotalCard>
    </div>
  );
}

// Green / red for an amount that can go negative (the company's net after pay).
function signClass(amount: number): string {
  return amount < 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400";
}

const TONES = {
  pay: {
    card: "from-sky-500/[0.07]",
    icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  net: {
    card: "from-emerald-500/[0.07]",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
};

interface TotalCardProps {
  tone: keyof typeof TONES;
  // SVG path data of the 24×24 line icon.
  icon: string;
  label: string;
  amount: number;
  hint: string;
  periodLabel: string;
  children: ReactNode;
}

function TotalCard({ tone, icon, label, amount, hint, periodLabel, children }: TotalCardProps) {
  const styles = TONES[tone];
  return (
    <section className={`flex flex-col gap-4 rounded-2xl border border-foreground/10 bg-gradient-to-br ${styles.card} to-transparent p-4 shadow-sm sm:p-5`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
          </span>
          <h2 className="text-sm font-semibold text-foreground/80">{label}</h2>
        </div>
        <span className="shrink-0 rounded-full border border-foreground/10 bg-background px-2.5 py-0.5 text-xs font-medium text-foreground/70">
          {periodLabel}
        </span>
      </header>
      <div>
        <p className={`text-amount text-3xl font-semibold tracking-tight tabular-nums ${tone === "net" ? signClass(amount) : ""}`}>
          {formatCurrency(amount)}
        </p>
        <p className="mt-1 text-xs text-foreground/60">{hint}</p>
      </div>
      {children}
    </section>
  );
}

interface SellerListProps {
  sellers: SellerTotals[];
  amount: (seller: SellerTotals) => number;
  colorOf: (userId: string) => string;
  // Amounts can be negative: colored green / red.
  signed?: boolean;
  scope: string;
  t: TranslateFn;
}

// Each worker: rank, color avatar with initials, name and days, amount, and a bar of
// their part of the largest amount in the list.
function SellerList({ sellers, amount, colorOf, signed = false, scope, t }: SellerListProps) {
  if (sellers.length === 0) return null;
  const largest = Math.max(1, ...sellers.map((s) => Math.abs(amount(s))));
  return (
    <div className="flex flex-col gap-1 border-t border-foreground/10 pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">{t("finance.perWorker", { scope })}</p>
      <ol className="flex flex-col">
        {sellers.map((s, index) => {
          const value = amount(s);
          return (
            <li key={s.userId} className="flex items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-foreground/[0.04]">
              <span className="w-4 text-right text-xs font-medium tabular-nums text-foreground/45">{index + 1}</span>
              <InitialsAvatar name={s.userName} color={colorOf(s.userId)} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium">
                    {s.userName}
                    <span className="ml-1.5 text-xs font-normal text-foreground/55">{daysText(s.days, t)}</span>
                  </span>
                  <span className={`text-amount whitespace-nowrap text-sm font-semibold tabular-nums ${signed ? signClass(value) : ""}`}>
                    {formatCurrency(value)}
                  </span>
                </div>
                <ShareBar fraction={Math.abs(value) / largest} color={signed && value < 0 ? "#e34948" : colorOf(s.userId)} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

// Drawn as SVG since the seller's color is computed (no inline styles).
function InitialsAvatar({ name, color }: { name: string; color: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 shrink-0">
      <circle cx="16" cy="16" r="16" fill={color} />
      <text x="16" y="16" dy="0.35em" textAnchor="middle" fontSize="12" fontWeight="600" fill="#ffffff">
        {initialsOf(name)}
      </text>
    </svg>
  );
}

function ShareBar({ fraction, color }: { fraction: number; color: string }) {
  return (
    <svg viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full">
      <rect width="100" height="4" className="fill-foreground/10" />
      <rect width={Math.max(2, fraction * 100)} height="4" fill={color} />
    </svg>
  );
}
