"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteDailyWorkRecord,
  updateDailyWorkRecord,
  type RecordActionState,
} from "@/actions/daily-work-records";
import { RecordFormFields } from "@/components/records/RecordFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { DailyWorkRecordRow } from "@/types/records";

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

interface EditRecordFormProps {
  record: DailyWorkRecordRow;
  onSaved: () => void;
  onCancel: () => void;
  t: TranslateFn;
}

export function EditRecordForm({ record, onSaved, onCancel, t }: EditRecordFormProps) {
  const [state, formAction] = useActionState(updateDailyWorkRecord, initialState);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  async function handleDelete() {
    if (!window.confirm(t("records.confirmDelete"))) return;

    setIsDeleting(true);
    setDeleteError(undefined);
    const result = await deleteDailyWorkRecord(record.id);
    if (result.success) {
      onSaved();
      return;
    }
    setDeleteError(result.error);
    setIsDeleting(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="recordId" value={record.id} />
      <RecordFormFields defaultValues={record} t={t} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      {deleteError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {deleteError}
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
          <SubmitButton t={t} />
        </div>
      </div>
    </form>
  );
}
