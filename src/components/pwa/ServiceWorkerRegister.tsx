"use client";

import { useEffect } from "react";
// Loaded on every page so the install prompt is caught as soon as the browser offers it.
import "@/lib/pwa/install-prompt";

// Registers public/sw.js (installable app, offline page). Production only, so the dev
// server never serves stale build files from the cache.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Not installable then, but the app works the same.
    });
  }, []);

  return null;
}
