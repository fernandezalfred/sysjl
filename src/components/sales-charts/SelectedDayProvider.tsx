"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SelectedDayContextValue {
  // The day the Sales by User charts show (YYYY-MM-DD), or null with no records.
  selectedDay: string | null;
  selectDay: (day: string) => void;
}

const SelectedDayContext = createContext<SelectedDayContextValue>({
  selectedDay: null,
  selectDay: () => {},
});

interface SelectedDayProviderProps {
  // The latest work day — shown until a day is picked in the records list.
  defaultDay: string | null;
  children: ReactNode;
}

// Shares the day picked in Sale Records / Totals by User with the Sales by User charts.
export function SelectedDayProvider({ defaultDay, children }: SelectedDayProviderProps) {
  // null = follow defaultDay, so a refresh that adds a newer day moves the charts to it.
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <SelectedDayContext.Provider value={{ selectedDay: picked ?? defaultDay, selectDay: setPicked }}>
      {children}
    </SelectedDayContext.Provider>
  );
}

export function useSelectedDay(): SelectedDayContextValue {
  return useContext(SelectedDayContext);
}
