"use client";

import { useState, useTransition } from "react";
import { repeatLastDayPurchases } from "@/actions/stock-purchases";
import type { TranslateFn } from "@/lib/i18n/translations";

interface RepeatLastDayButtonProps {
  t: TranslateFn;
}

interface Feedback {
  ok: boolean;
  text: string;
}

// Copies the most recent day's purchases into today in one click (see
// repeatLastDayPurchases), after a confirmation since it creates several entries.
export function RepeatLastDayButton({ t }: RepeatLastDayButtonProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function handleClick() {
    if (!window.confirm(t("repeat.confirm"))) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await repeatLastDayPurchases();
      setFeedback(
        result.success
          ? { ok: true, text: t("repeat.done", { count: result.count ?? 0 }) }
          : { ok: false, text: t(`repeat.error.${result.error ?? "nothingToCopy"}`) },
      );
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? t("repeat.copying") : t("repeat.button")}
      </button>
      {feedback ? (
        <p
          role={feedback.ok ? "status" : "alert"}
          className={`text-xs ${feedback.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
