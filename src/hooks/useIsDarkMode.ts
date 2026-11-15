"use client";

import { useSyncExternalStore } from "react";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Tracks the OS color scheme so charts can pick their light or dark palette step. The
// server (which can't know the scheme) and the hydrating render both use light, then
// React re-renders with the real scheme, so the HTML never mismatches on hydration.
export function useIsDarkMode(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
}
