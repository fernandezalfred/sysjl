"use client";

import { useSyncExternalStore } from "react";
import { currentTheme, subscribeTheme } from "@/lib/theme";

// Tracks the mode on screen (the user's choice or the OS one) so charts can pick their
// light or dark palette step. The server (which can't know it) and the hydrating render
// both use light, then React re-renders with the real mode, so the HTML never
// mismatches on hydration.
export function useIsDarkMode(): boolean {
  return useSyncExternalStore(subscribeTheme, () => currentTheme() === "dark", () => false);
}
