"use client";

import type { ReactNode } from "react";
import { formatShortDate } from "@/lib/dates";
import { useSelectedDay } from "@/components/sales-charts/SelectedDayProvider";

interface DayHeaderButtonProps {
  date: string;
  title: string;
  className?: string;
  // Shown on the right of the date, e.g. the day's Net profit.
  trailing?: ReactNode;
}

export const SALES_CHARTS_SECTION_ID = "sales-charts";

// A records list's day header: click to show that day in the Sales by User charts
// (scrolled into view), with the shown day highlighted.
export function DayHeaderButton({ date, title, className = "", trailing }: DayHeaderButtonProps) {
  const { selectedDay, selectDay } = useSelectedDay();
  const isSelected = selectedDay === date;

  function handleClick() {
    selectDay(date);
    document.getElementById(SALES_CHARTS_SECTION_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSelected}
      title={title}
      className={`flex w-full cursor-pointer flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-l-4 text-left text-sm font-semibold uppercase tracking-wide transition-colors ${
        isSelected
          ? "border-sky-600 bg-sky-100 text-sky-900 dark:border-sky-400 dark:bg-sky-950/60 dark:text-sky-200"
          : "border-transparent bg-foreground/10 text-foreground hover:bg-sky-50 hover:text-sky-900 dark:bg-foreground/15 dark:hover:bg-sky-950/40 dark:hover:text-sky-200"
      } ${className}`}
    >
      <span>{formatShortDate(date)}</span>
      {trailing ? <span>{trailing}</span> : null}
    </button>
  );
}
