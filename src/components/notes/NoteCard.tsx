"use client";

import { NOTE_COLOR_STYLES } from "@/components/notes/note-colors";
import { TaskCheckbox } from "@/components/notes/TaskCheckbox";
import type { TranslateFn } from "@/lib/i18n/translations";
import { noteProgress, type NoteItem, type NoteRow } from "@/lib/notes";

// Tasks shown on a card; the rest are counted ("+3 más") and seen in the editor.
const CARD_TASKS = 6;

interface NoteCardProps {
  note: NoteRow;
  editedLabel: string;
  onOpen: (note: NoteRow) => void;
  onTogglePin: (note: NoteRow) => void;
  onToggleItem: (note: NoteRow, item: NoteItem) => void;
  onDelete: (note: NoteRow) => void;
  t: TranslateFn;
}

const ICON_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-lg text-foreground/55 transition hover:bg-foreground/10 hover:text-foreground sm:h-9 sm:w-9";
// On wider screens a card's actions show on hover / keyboard focus (always on phones).
const SHOW_ON_HOVER = "sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100";

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      <path d="M9 3h6l-1 6 4 4v2H6v-2l4-4z" />
      <path d="M12 15v6" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

// One note in the grid: clicking it opens it for editing; pin and delete sit in its footer.
function TaskList({ note, onToggleItem, t }: Pick<NoteCardProps, "note" | "onToggleItem" | "t">) {
  const hidden = note.items.length - CARD_TASKS;
  return (
    <div className="flex flex-col px-4 pb-1">
      <ul className="flex flex-col gap-0.5">
        {note.items.slice(0, CARD_TASKS).map((item) => (
          <li key={item.id} className="flex min-h-8 items-start gap-2.5 py-0.5">
            <span className="mt-[3px] flex">
              <TaskCheckbox
                done={item.done}
                label={t(item.done ? "notes.taskUndone" : "notes.taskDone", { task: item.text })}
                onToggle={() => onToggleItem(note, item)}
              />
            </span>
            <span className={`text-sm leading-6 break-words ${item.done ? "text-foreground/45 line-through decoration-foreground/40" : "text-foreground/85"}`}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
      {hidden > 0 ? <p className="pt-0.5 pl-7 text-xs text-foreground/50">{t("notes.moreTasks", { count: hidden })}</p> : null}
    </div>
  );
}

// "2/5 hechas" with a thin bar, or a green "Completada" badge once every task is done.
function Progress({ note, t }: Pick<NoteCardProps, "note" | "t">) {
  const { done, total, complete } = noteProgress(note.items);
  if (complete) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
        {t("notes.complete")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs text-foreground/55 tabular-nums">
      <progress
        value={done}
        max={total}
        aria-hidden="true"
        className="h-1.5 w-14 appearance-none overflow-hidden rounded-full bg-foreground/10 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-sky-500 [&::-webkit-progress-bar]:bg-foreground/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-sky-500"
      />
      {t("notes.progress", { done, total })}
    </span>
  );
}

export function NoteCard({ note, editedLabel, onOpen, onTogglePin, onToggleItem, onDelete, t }: NoteCardProps) {
  const title = note.title || t("notes.untitled");
  const { complete } = noteProgress(note.items);

  return (
    <article
      className={`group flex flex-col rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${NOTE_COLOR_STYLES[note.color].card}`}
    >
      <button
        type="button"
        onClick={() => onOpen(note)}
        className="flex flex-1 flex-col gap-2 rounded-t-2xl px-4 pt-4 pb-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <h3
          className={`text-base leading-snug font-semibold break-words ${note.title ? "" : "text-foreground/50 italic"} ${complete ? "text-foreground/60 line-through decoration-foreground/30" : ""}`}
        >
          {title}
        </h3>
        {note.content ? (
          <p className="line-clamp-8 text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground/80">{note.content}</p>
        ) : null}
      </button>

      {note.items.length > 0 ? (
        <>
          <TaskList note={note} onToggleItem={onToggleItem} t={t} />
          <div className="px-4 pt-1">
            <Progress note={note} t={t} />
          </div>
        </>
      ) : null}

      <footer className="flex items-center justify-between gap-2 px-2 pb-2 pl-4">
        <span className="truncate text-xs text-foreground/50">{editedLabel}</span>
        <div className="flex flex-shrink-0 items-center">
          <button
            type="button"
            onClick={() => onTogglePin(note)}
            aria-pressed={note.pinned}
            aria-label={note.pinned ? t("notes.unpin") : t("notes.pin")}
            title={note.pinned ? t("notes.unpin") : t("notes.pin")}
            className={`${ICON_BUTTON} ${note.pinned ? "text-amber-600 dark:text-amber-400" : SHOW_ON_HOVER}`}
          >
            <PinIcon filled={note.pinned} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(note)}
            aria-label={t("notes.delete")}
            title={t("notes.delete")}
            className={`${ICON_BUTTON} ${SHOW_ON_HOVER} hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
          >
            <TrashIcon />
          </button>
        </div>
      </footer>
    </article>
  );
}
