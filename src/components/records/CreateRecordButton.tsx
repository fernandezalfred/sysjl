"use client";

import { useRef, useState } from "react";
import { CreateRecordForm } from "@/components/records/CreateRecordForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";

interface CreateRecordButtonProps {
  isAdmin: boolean;
  vehicleUsers: { id: string; name: string }[];
  locale: Locale;
}

export function CreateRecordButton({ isAdmin, vehicleUsers, locale }: CreateRecordButtonProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Bumped on every open so the form below always gets a fresh `key` — without it,
  // reopening reuses the same form instance. Its useActionState result stays
  // { success: true } from the prior save, and since `close` is a new function
  // reference on every render, the form's "call onSaved on success" effect re-fires
  // on the next render and immediately closes the dialog that was just reopened.
  const [formKey, setFormKey] = useState(0);

  function open() {
    setFormKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
      >
        {t("records.newRecord")}
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-foreground/10 bg-background p-6 text-foreground"
      >
        <h3 className="mb-4 text-sm font-medium">{t("records.newRecord")}</h3>
        <CreateRecordForm
          key={formKey}
          onSaved={close}
          onCancel={close}
          isAdmin={isAdmin}
          vehicleUsers={vehicleUsers}
          t={t}
        />
      </dialog>
    </>
  );
}
