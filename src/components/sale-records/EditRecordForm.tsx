"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteDailyWorkRecord,
  updateDailyWorkRecord,
  type RecordActionState,
} from "@/actions/daily-work-records";
import { RecordFormFields } from "@/components/sale-records/RecordFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { DailyWorkRecordRow } from "@/types/daily-records";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";
import { useSuccessToast } from "@/hooks/useSuccessToast";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";

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

interface EditRecordFormProps {
  record: DailyWorkRecordRow;
  onSaved: () => void;
  onCancel: () => void;
  t: TranslateFn;
}

export function EditRecordForm({ record, onSaved, onCancel, t }: EditRecordFormProps) {
  const [state, formAction, pending] = useActionState(updateDailyWorkRecord, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  useSuccessToast(state, t("toast.recordUpdated"));
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  async function handleDelete() {
    if (!(await confirmAlert(t, t("records.confirmDelete"), { danger: true }))) return;

    setIsDeleting(true);
    const result = await deleteDailyWorkRecord(record.id);
    if (result.success) {
      successToast(t("toast.recordDeleted"));
      onSaved();
      return;
    }
    errorAlert(t, localizeError(t, result.error ?? ""));
    setIsDeleting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="recordId" value={record.id} />
      {/* Disabled: a record's seller can't be changed on edit, and a disabled field is never submitted. */}
      <div className="flex flex-col gap-1">
        <label htmlFor="edit-record-user" className="text-xs font-medium text-foreground/70">
          {t("records.userLabel")}
        </label>
        <input
          id="edit-record-user"
          type="text"
          value={record.userName}
          disabled
          className="cursor-not-allowed rounded-md border border-foreground/10 bg-foreground/10 px-3 py-2 text-base text-foreground/60"
        />
      </div>
      <RecordFormFields defaultValues={record} t={t} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {localizeError(t, state.error)}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
        >
          {isDeleting ? t("records.deleting") : t("records.delete")}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
          >
            {t("records.cancel")}
          </button>
          <SubmitButton t={t} pending={pending} />
        </div>
      </div>
    </form>
  );
}
