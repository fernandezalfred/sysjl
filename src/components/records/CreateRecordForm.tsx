"use client";

import { useActionState, useEffect } from "react";
import { createDailyWorkRecord, type RecordActionState } from "@/actions/daily-work-records";
import { RecordFormFields } from "@/components/records/RecordFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";
import { useSuccessToast } from "@/hooks/useSuccessToast";

const initialState: RecordActionState = { success: false };

function SubmitButton({ t, pending }: { t: TranslateFn; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
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

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
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
            className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
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

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
        >
          {t("records.cancel")}
        </button>
        <SubmitButton t={t} pending={pending} />
      </div>
    </form>
  );
}
