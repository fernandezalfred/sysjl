"use client";

import { useActionState, useEffect, useState } from "react";
import { createNote, updateNote } from "@/actions/notes";
import { ChecklistEditor } from "@/components/notes/ChecklistEditor";
import { NOTE_COLOR_STYLES } from "@/components/notes/note-colors";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { useSuccessToast } from "@/hooks/useSuccessToast";
import { localizeError } from "@/lib/i18n/errors";
import type { TranslateFn } from "@/lib/i18n/translations";
import { NOTE_COLORS, NOTE_CONTENT_MAX, NOTE_TITLE_MAX, type NoteColorName, type NoteRow } from "@/lib/notes";
import type { ActionState } from "@/types/actions";

const initialState: ActionState = { success: false };

interface NoteFormProps {
  // The note to edit; a new note when absent.
  note?: NoteRow;
  onSaved: () => void;
  onCancel: () => void;
  onDelete?: (note: NoteRow) => void;
  t: TranslateFn;
}

export function NoteForm({ note, onSaved, onCancel, onDelete, t }: NoteFormProps) {
  const [state, formAction, pending] = useActionState(note ? updateNote : createNote, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  useSuccessToast(state, t(note ? "toast.noteUpdated" : "toast.noteCreated"));
  const [color, setColor] = useState<NoteColorName>(note?.color ?? "DEFAULT");
  const [length, setLength] = useState(note?.content.length ?? 0);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {note ? <input type="hidden" name="noteId" value={note.id} /> : null}

      <div className={`flex flex-col rounded-xl border transition-colors ${NOTE_COLOR_STYLES[color].card}`}>
        <label htmlFor="note-title" className="sr-only">
          {t("notes.title")}
        </label>
        <input
          id="note-title"
          name="title"
          type="text"
          maxLength={NOTE_TITLE_MAX}
          defaultValue={note?.title}
          placeholder={t("notes.titlePlaceholder")}
          autoFocus
          className="rounded-t-xl bg-transparent px-4 pt-3 pb-1 text-base font-semibold placeholder:text-foreground/40 focus:outline-none sm:text-lg"
        />
        <label htmlFor="note-content" className="sr-only">
          {t("notes.content")}
        </label>
        <textarea
          id="note-content"
          name="content"
          rows={4}
          maxLength={NOTE_CONTENT_MAX}
          defaultValue={note?.content}
          onChange={(event) => setLength(event.target.value.length)}
          placeholder={t("notes.contentPlaceholder")}
          className="vertical-scroll min-h-24 resize-y bg-transparent px-4 py-2 text-base leading-relaxed placeholder:text-foreground/40 focus:outline-none sm:text-sm"
        />
        <p className={`px-4 pb-1 text-right text-xs tabular-nums ${length > NOTE_CONTENT_MAX * 0.9 ? "text-amber-600 dark:text-amber-400" : "text-foreground/40"}`}>
          {length.toLocaleString()} / {NOTE_CONTENT_MAX.toLocaleString()}
        </p>
        <div className="border-t border-foreground/10 pt-2">
          <ChecklistEditor initialItems={note?.items ?? []} t={t} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">{t("notes.color")}</legend>
          {NOTE_COLORS.map((name) => (
            <label key={name} title={t(NOTE_COLOR_STYLES[name].label)} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={name}
                checked={color === name}
                onChange={() => setColor(name)}
                className="peer sr-only"
              />
              <span className="sr-only">{t(NOTE_COLOR_STYLES[name].label)}</span>
              <span
                aria-hidden="true"
                className={`block h-8 w-8 rounded-full border-2 transition peer-checked:ring-2 peer-checked:ring-foreground peer-checked:ring-offset-2 peer-checked:ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500 ${NOTE_COLOR_STYLES[name].swatch}`}
              />
            </label>
          ))}
        </fieldset>

        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" name="pinned" defaultChecked={note?.pinned} className="h-4 w-4 accent-amber-600" />
          {t("notes.pinLabel")}
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {localizeError(t, state.error)}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-foreground/10 pt-4">
        {note && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(note)}
            className="min-h-10 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
          >
            {t("notes.delete")}
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="min-h-10 rounded-md px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground">
            {t("notes.cancel")}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="min-h-10 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {pending ? t("notes.saving") : t("notes.save")}
          </button>
        </div>
      </div>
    </form>
  );
}
