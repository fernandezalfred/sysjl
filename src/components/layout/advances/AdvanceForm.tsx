"use client";

import { useActionState, useEffect } from "react";
import { createPayAdvance, updatePayAdvance } from "@/actions/pay-advances";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { useSuccessToast } from "@/hooks/useSuccessToast";
import { todayDateString } from "@/lib/dates";
import { localizeError } from "@/lib/i18n/errors";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { AdvanceSeller, PayAdvanceRow } from "@/lib/money/pay-advances";
import type { ActionState } from "@/types/actions";

const initialState: ActionState = { success: false };

const inputClass = "rounded-md border border-foreground/20 bg-background px-3 py-2 text-base";
const labelClass = "text-xs font-medium text-foreground/70";

interface AdvanceFormProps {
  // Editing: the advance to change. Creating: the sellers to pick from, and the one
  // picked first (when opened from a seller's list).
  advance?: PayAdvanceRow;
  sellers?: AdvanceSeller[];
  defaultUserId?: string;
  onSaved: () => void;
  onCancel: () => void;
  t: TranslateFn;
}

export function AdvanceForm({ advance, sellers, defaultUserId, onSaved, onCancel, t }: AdvanceFormProps) {
  const [state, formAction, pending] = useActionState(advance ? updatePayAdvance : createPayAdvance, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  useSuccessToast(state, t(advance ? "toast.advanceUpdated" : "toast.advanceCreated"));

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {advance ? (
        <input type="hidden" name="advanceId" value={advance.id} />
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor="advance-user" className={labelClass}>
            {t("advances.seller")}
          </label>
          <select id="advance-user" name="userId" required defaultValue={defaultUserId ?? ""} className={inputClass}>
            <option value="" disabled>
              {t("advances.selectSeller")}
            </option>
            {sellers?.map((seller) => (
              <option key={seller.userId} value={seller.userId}>
                {seller.userName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="advance-date" className={labelClass}>
          {t("advances.date")}
        </label>
        <input
          id="advance-date"
          name="date"
          type="date"
          max={todayDateString()}
          required
          defaultValue={advance?.date ?? todayDateString()}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="advance-amount" className={labelClass}>
          {t("advances.amount")}
        </label>
        <input
          id="advance-amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          defaultValue={advance?.amount}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="advance-description" className={labelClass}>
          {t("advances.description")}
        </label>
        <input
          id="advance-description"
          name="description"
          type="text"
          maxLength={200}
          defaultValue={advance?.description}
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {localizeError(t, state.error)}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="min-h-10 rounded-md px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground">
          {t("advances.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="min-h-10 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? t("advances.saving") : t("advances.save")}
        </button>
      </div>
    </form>
  );
}
