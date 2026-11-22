"use client";

import { useInstallMode } from "@/hooks/useInstallMode";
import { infoAlert } from "@/lib/alerts";
import { promptInstall } from "@/lib/pwa/install-prompt";
import type { TranslateFn } from "@/lib/i18n/translations";

// "Instalar app" in the panel sidebar: the browser's install prompt where there is
// one, the Add to Home Screen steps on iPhone/iPad; hidden once installed.
export function InstallAppButton({ t }: { t: TranslateFn }) {
  const mode = useInstallMode();
  if (!mode) return null;

  function handleClick() {
    if (mode === "prompt") void promptInstall();
    else void infoAlert(t, t("install.iosTitle"), t("install.iosText"));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-3 py-2 text-left transition hover:bg-sky-500/10"
    >
      <span aria-hidden="true" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">{t("install.button")}</span>
        <span className="truncate text-xs text-foreground/60">{t("install.hint")}</span>
      </span>
    </button>
  );
}
