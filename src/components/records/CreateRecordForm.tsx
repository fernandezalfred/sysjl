"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createDailyWorkRecord, type RecordActionState } from "@/actions/daily-work-records";
import { RecordFormFields } from "@/components/records/RecordFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";

const initialState: RecordActionState = { success: false };

function SubmitButton({ t }: { t: TranslateFn }) {
  const { pending } = useFormStatus();
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
  vehicleUsers: { id: string; name: string }[];
  t: TranslateFn;
}

export function CreateRecordForm({ onSaved, onCancel, isAdmin, vehicleUsers, t }: CreateRecordFormProps) {
  const [state, formAction] = useActionState(createDailyWorkRecord, initialState);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {isAdmin ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="record-user" className="text-xs font-medium text-foreground/60">
            {t("records.userLabel")}
          </label>
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
            {vehicleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <RecordFormFields t={t} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
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
        <SubmitButton t={t} />
      </div>
    </form>
  );
}
