"use client";

import { useRef } from "react";
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

  function open() {
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
