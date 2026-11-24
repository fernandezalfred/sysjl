"use client";

import { currentTheme, setTheme } from "@/lib/theme";

interface ThemeToggleProps {
  label: string;
}

// Switches between light and dark mode. Both icons are rendered and CSS shows the
// right one (moon in light mode, sun in dark), so the server HTML always matches.
export function ThemeToggle({ label }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={() => setTheme(currentTheme() === "dark" ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-lg text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground"
    >
      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5 dark:hidden">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="hidden size-5 dark:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
