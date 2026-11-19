import type { ReactNode } from "react";

interface FinanceCardProps {
  title: string;
  subtitle?: string;
  // Small element at the right of the header (a chip, a legend).
  aside?: ReactNode;
  children: ReactNode;
}

// The card every chart on Ingresos y egresos sits in: title, optional subtitle, content.
export function FinanceCard({ title, subtitle, aside, children }: FinanceCardProps) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4 shadow-sm sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-foreground/65">{subtitle}</p> : null}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

// "1 día" / "3 días".
export function daysText(count: number, t: Translate): string {
  return count === 1 ? t("finance.dayCountOne") : t("finance.daysCount", { count });
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

// "Calculado con 2 días": the same for every seller in the equal-days comparison.
export function calculatedDaysText(days: number, t: Translate): string {
  return days === 1 ? t("finance.calculatedDaysOne") : t("finance.calculatedDays", { days });
}

// Header chip of the equal-days charts: how many days every seller is compared over.
export function DaysPerSellerBadge({ days, t }: { days: number; t: Translate }) {
  return (
    <span className="shrink-0 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
      {days === 1 ? t("finance.daysPerSellerOne") : t("finance.daysPerSeller", { days })}
    </span>
  );
}
