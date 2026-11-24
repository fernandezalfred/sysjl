"use client";

import { useActionState, useEffect } from "react";
import { createDailyWorkRecord } from "@/actions/daily-work-records";
import type { ActionState } from "@/types/actions";
import { FIELD_STATE_CLASS, RecordFormFields } from "@/components/sale-records/RecordFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";
import { useSuccessToast } from "@/hooks/useSuccessToast";
import { useErrorAlert } from "@/hooks/useErrorAlert";
import { useInvalidFormAlert } from "@/hooks/useInvalidFormAlert";

const initialState: ActionState = { success: false };

function SubmitButton({ t, pending }: { t: TranslateFn; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60 sm:min-h-0"
    >
      {pending ? t("records.saving") : t("records.save")}
    </button>
  );
}

interface CreateRecordFormProps {
  onSaved: () => void;
  onCancel: () => void;
  isAdmin: boolean;
  activeUsers: { id: string; name: string }[];
  // Shown, locked, in the User field for a vehicle user — their record is always
  // their own (the server takes the user from the session, never from the form).
  currentUserName: string | null;
  t: TranslateFn;
}

export function CreateRecordForm({ onSaved, onCancel, isAdmin, activeUsers, currentUserName, t }: CreateRecordFormProps) {
  const [state, formAction, pending] = useActionState(createDailyWorkRecord, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  useSuccessToast(state, t("toast.recordCreated"));
  useErrorAlert(state, t);
  const handleInvalid = useInvalidFormAlert(t);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  return (
    <form onSubmit={handleSubmit} onInvalid={handleInvalid} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="record-user" className="text-xs font-medium text-foreground/70">
          {t("records.userLabel")}
        </label>
        {isAdmin ? (
          <select
            id="record-user"
            name="userId"
            required
            defaultValue=""
            className={`rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base ${FIELD_STATE_CLASS}`}
          >
            <option value="" disabled>
              {t("records.selectUser")}
            </option>
            {activeUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        ) : (
          // Same dropdown as the admin's, with the driver as its only option. It has no
          // `name`, so nothing is submitted — the server uses the session user.
          <select
            id="record-user"
            defaultValue="self"
            className={`rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base ${FIELD_STATE_CLASS}`}
          >
            <option value="self">{currentUserName ?? ""}</option>
          </select>
        )}
      </div>

      <RecordFormFields t={t} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {localizeError(t, state.error)}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 border-t border-foreground/10 pt-3 sm:flex sm:justify-end sm:border-0 sm:pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="min-h-11 rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground disabled:opacity-60 sm:min-h-0 sm:border-transparent"
        >
          {t("records.cancel")}
        </button>
        <SubmitButton t={t} pending={pending} />
      </div>
    </form>
  );
}
