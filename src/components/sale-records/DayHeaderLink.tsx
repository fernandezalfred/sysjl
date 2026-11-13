import type { ReactNode } from "react";
import Link from "next/link";
import { formatShortDate } from "@/lib/dates";

interface DayHeaderLinkProps {
  date: string;
  title: string;
  className?: string;
  // Shown on the right of the date, e.g. the day's Net profit.
  trailing?: ReactNode;
}

// A Sale Records day header: opens the charts page showing that day.
export function DayHeaderLink({ date, title, className = "", trailing }: DayHeaderLinkProps) {
  return (
    <Link
      href={`/charts?day=${date}`}
      title={title}
      className={`flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-l-4 border-transparent bg-foreground/10 text-left text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-900 dark:bg-foreground/15 dark:hover:border-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-200 ${className}`}
    >
      <span>{formatShortDate(date)}</span>
      {trailing ? <span>{trailing}</span> : null}
    </Link>
  );
}
