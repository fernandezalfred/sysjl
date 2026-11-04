"use client";

import { formatShortDate } from "@/lib/dates";
import { useSelectedDay } from "@/components/sales-charts/SelectedDayProvider";

interface DayHeaderButtonProps {
  date: string;
  title: string;
  className?: string;
}

export const SALES_CHARTS_SECTION_ID = "sales-charts";

// A records list's day header: click to show that day in the Sales by User charts
// (scrolled into view), with the shown day highlighted.
export function DayHeaderButton({ date, title, className = "" }: DayHeaderButtonProps) {
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
      className={`w-full cursor-pointer text-left text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground/20 dark:hover:bg-foreground/25 ${
        isSelected ? "bg-foreground/20 ring-2 ring-inset ring-foreground/40 dark:bg-foreground/25" : "bg-foreground/10 dark:bg-foreground/15"
      } ${className}`}
    >
      {formatShortDate(date)}
    </button>
  );
}
