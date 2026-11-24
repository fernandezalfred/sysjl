"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("readystatechange", onChange);
  return () => document.removeEventListener("readystatechange", onChange);
}

// The page has finished loading: the streamed panel and page content included.
function isLoaded() {
  return document.readyState === "complete";
}

// Only while the installed app (standalone) opens: a full-screen progress bar in
// place of the logo, from the first paint until the panel has loaded, then it fades
// out. It's in the static shell, so it shows before any data. If the page never
// hydrates, a CSS timeout hides it anyway (animate-launch-timeout).
export function LaunchProgress({ label }: { label: string }) {
  const loaded = useSyncExternalStore(subscribe, isLoaded, () => false);

  return (
    <div
      aria-hidden={loaded}
      className={`fixed inset-0 z-[100] hidden items-center justify-center bg-background transition-[opacity,visibility] duration-300 standalone:flex ${
        loaded ? "invisible opacity-0" : "animate-launch-timeout"
      }`}
    >
      <div
        role="progressbar"
        aria-label={label}
        className="h-1.5 w-48 overflow-hidden rounded-full bg-foreground/15"
      >
        <div
          className={`h-full rounded-full bg-sky-500 transition-[width] duration-300 ${
            loaded ? "w-full" : "animate-launch-progress"
          }`}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
