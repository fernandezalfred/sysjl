"use client";

import { useSyncExternalStore } from "react";

// Below Tailwind's sm breakpoint (640px): a phone held upright.
const NARROW_QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Lets charts drop axis titles and use smaller ticks on phones (canvas options can't
// use CSS breakpoints). The server and the hydrating render assume a wide screen,
// then React re-renders with the real width, so hydration never mismatches.
export function useIsNarrowScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}
