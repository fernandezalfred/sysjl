"use client";

import { useRef, useState } from "react";
import { formatShortDate } from "@/lib/dates";
import { CreateRecordForm } from "@/components/records/CreateRecordForm";
import { EditRecordForm } from "@/components/records/EditRecordForm";
import type { DailyWorkRecordRow } from "@/types/records";

interface MyRecordsSectionProps {
  records: DailyWorkRecordRow[];
}

type Mode = { type: "create" } | { type: "edit"; record: DailyWorkRecordRow };

export function MyRecordsSection({ records }: MyRecordsSectionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>({ type: "create" });

  function openCreate() {
    setMode({ type: "create" });
    dialogRef.current?.showModal();
  }

  function openEdit(record: DailyWorkRecordRow) {
    setMode({ type: "edit", record });
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <section aria-labelledby="my-records-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          id="my-records-heading"
          className="text-sm font-medium uppercase tracking-wide text-foreground/60"
        >
          My Records
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
        >
          New record
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {records.map((record) => (
          <li
            key={record.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 p-3 text-sm"
          >
            <div>
              <div className="font-medium">{formatShortDate(record.date)}</div>
              <div className="text-xs text-foreground/60">
                Queso {record.quesoTaken - record.quesoRemaining} sold · Yogurt{" "}
                {record.yogurtTaken - record.yogurtRemaining} sold
              </div>
            </div>
            <button
              type="button"
              onClick={() => openEdit(record)}
              className="text-sm text-foreground/60 underline hover:text-foreground"
            >
              Edit
            </button>
          </li>
        ))}
        {records.length === 0 ? (
          <li className="text-sm text-foreground/60">No records yet.</li>
        ) : null}
      </ul>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-foreground/10 bg-background p-6 text-foreground"
      >
        <h3 className="mb-4 text-sm font-medium">
          {mode.type === "create" ? "New record" : "Edit record"}
        </h3>
        {mode.type === "create" ? (
          <CreateRecordForm key="create" onSaved={close} onCancel={close} />
        ) : (
          <EditRecordForm key={mode.record.id} record={mode.record} onSaved={close} onCancel={close} />
        )}
      </dialog>
    </section>
  );
}
