"use client";

import { useTransition } from "react";
import { repeatLastDayPurchases } from "@/actions/stock-purchases";
import type { TranslateFn } from "@/lib/i18n/translations";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";

interface RepeatLastDayButtonProps {
  t: TranslateFn;
}

// Copies the most recent day's purchases into today in one click (see
// repeatLastDayPurchases), after a confirmation since it creates several entries.
export function RepeatLastDayButton({ t }: RepeatLastDayButtonProps) {
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    if (!(await confirmAlert(t, t("repeat.confirm")))) return;
    startTransition(async () => {
      const result = await repeatLastDayPurchases();
      if (result.success) successToast(t("repeat.done", { count: result.count ?? 0 }));
      else errorAlert(t, t(`repeat.error.${result.error ?? "nothingToCopy"}`));
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium disabled:opacity-60"
    >
      {pending ? t("repeat.copying") : t("repeat.button")}
    </button>
  );
}
