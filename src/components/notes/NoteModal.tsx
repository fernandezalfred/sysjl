"use client";

import { useCallback, useImperativeHandle, useRef, useState, type Ref } from "react";
import { NoteForm } from "@/components/notes/NoteForm";
import { useBackdropClose } from "@/hooks/useBackdropClose";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { NoteRow } from "@/lib/notes";

export interface NoteModalHandle {
  // Opens the form for `note`, or for a new note.
  show: (note?: NoteRow) => void;
  close: () => void;
}

interface NoteModalProps {
  ref: Ref<NoteModalHandle>;
  onDelete: (note: NoteRow) => void;
  t: TranslateFn;
}

export function NoteModal({ ref, onDelete, t }: NoteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropClose = useBackdropClose();
  // undefined: closed; null: a new note.
  const [note, setNote] = useState<NoteRow | null | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);

  const close = useCallback(() => dialogRef.current?.close(), []);
  const show = useCallback((next?: NoteRow) => {
    setNote(next ?? null);
    setFormKey((key) => key + 1);
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  useImperativeHandle(ref, () => ({ show, close }), [show, close]);

  return (
    <dialog
      ref={dialogRef}
      {...backdropClose}
      onClose={() => setNote(undefined)}
      aria-labelledby="note-modal-title"
      className="w-[calc(100%-1.5rem)] max-h-[90dvh] max-w-2xl overflow-y-auto rounded-2xl border border-foreground/10 bg-background p-4 text-foreground shadow-2xl sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="note-modal-title" className="text-base font-semibold">
          {note ? t("notes.editTitle") : t("notes.newTitle")}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label={t("records.close")}
          className="-mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {note !== undefined ? (
        <NoteForm key={formKey} note={note ?? undefined} onSaved={close} onCancel={close} onDelete={onDelete} t={t} />
      ) : null}
    </dialog>
  );
}
