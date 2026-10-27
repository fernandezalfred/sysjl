"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { updateDailyWorkRecord, type RecordActionState } from "@/actions/daily-work-records";
import { RecordFormFields } from "@/components/records/RecordFormFields";
import type { DailyWorkRecordRow } from "@/types/records";

const initialState: RecordActionState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save record"}
    </button>
  );
}

interface EditRecordFormProps {
  record: DailyWorkRecordRow;
  onSaved: () => void;
  onCancel: () => void;
}

export function EditRecordForm({ record, onSaved, onCancel }: EditRecordFormProps) {
  const [state, formAction] = useActionState(updateDailyWorkRecord, initialState);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state.success, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="recordId" value={record.id} />
      <RecordFormFields defaultValues={record} />

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
          Cancel
        </button>
        <SubmitButton />
      </div>
    </form>
  );
}
