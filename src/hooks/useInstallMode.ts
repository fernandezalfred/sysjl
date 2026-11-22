"use client";

import { useSyncExternalStore } from "react";
import { getInstallMode, subscribeInstallMode, type InstallMode } from "@/lib/pwa/install-prompt";

// How the Instalar app button installs the app here; null (hidden) on the server.
export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribeInstallMode, getInstallMode, () => null);
}
