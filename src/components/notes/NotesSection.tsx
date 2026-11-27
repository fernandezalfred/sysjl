"use client";

import { startTransition, useEffect, useMemo, useOptimistic, useRef, useState, type ReactNode } from "react";
import { deleteNote, setNoteItemDone, setNotePinned } from "@/actions/notes";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteModal, type NoteModalHandle } from "@/components/notes/NoteModal";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";
import { BUSINESS_TIME_ZONE } from "@/lib/dates";
import { localizeError } from "@/lib/i18n/errors";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import { filterNotes, noteProgress, setItemDone, sortNotes, type NoteItem, type NoteRow } from "@/lib/notes";

type OptimisticChange =
  | { kind: "pin"; id: string; pinned: boolean }
  | { kind: "item"; id: string; itemId: string; done: boolean }
  | { kind: "delete"; id: string };

function applyChange(notes: NoteRow[], change: OptimisticChange): NoteRow[] {
  if (change.kind === "delete") return notes.filter((note) => note.id !== change.id);
  return notes.map((note) => {
    if (note.id !== change.id) return note;
    if (change.kind === "pin") return { ...note, pinned: change.pinned };
    return { ...note, items: setItemDone(note.items, change.itemId, change.done) };
  });
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

function NoteGrid({ title, notes, render }: { title?: string; notes: NoteRow[]; render: (note: NoteRow) => ReactNode }) {
  if (notes.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      {title ? <h2 className="text-xs font-semibold tracking-wider text-foreground/50 uppercase">{title}</h2> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{notes.map(render)}</div>
    </section>
  );
}

// The Notas page: search, "Nueva nota", and the user's notes as cards: pinned first,
// then the others, and the completed ones (every task done) last.
export function NotesSection({ notes, locale }: { notes: NoteRow[]; locale: Locale }) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [optimisticNotes, applyOptimistic] = useOptimistic(notes, applyChange);
  const [query, setQuery] = useState("");
  const modal = useRef<NoteModalHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "es" ? "es-BO" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: BUSINESS_TIME_ZONE,
      }),
    [locale],
  );

  // "/" jumps to the search box (unless typing somewhere already).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || target.closest("input, textarea, select, dialog[open]")) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visible = filterNotes(sortNotes(optimisticNotes), query);
  // Notes whose every task is done move to "Completadas" at the end.
  const completed = visible.filter((note) => noteProgress(note.items).complete);
  const open = visible.filter((note) => !noteProgress(note.items).complete);
  const pinned = open.filter((note) => note.pinned);
  const others = open.filter((note) => !note.pinned);

  function togglePin(note: NoteRow) {
    startTransition(async () => {
      applyOptimistic({ kind: "pin", id: note.id, pinned: !note.pinned });
      const result = await setNotePinned(note.id, !note.pinned);
      if (!result.success) errorAlert(t, localizeError(t, result.error ?? ""));
    });
  }

  function toggleItem(note: NoteRow, item: NoteItem) {
    startTransition(async () => {
      applyOptimistic({ kind: "item", id: note.id, itemId: item.id, done: !item.done });
      const result = await setNoteItemDone(note.id, item.id, !item.done);
      if (!result.success) errorAlert(t, localizeError(t, result.error ?? ""));
    });
  }

  async function remove(note: NoteRow) {
    const text = t("notes.confirmDelete", { title: note.title || t("notes.untitled") });
    if (!(await confirmAlert(t, text, { danger: true }))) return;
    modal.current?.close();
    startTransition(async () => {
      applyOptimistic({ kind: "delete", id: note.id });
      const result = await deleteNote(note.id);
      if (result.success) successToast(t("toast.noteDeleted"));
      else errorAlert(t, localizeError(t, result.error ?? ""));
    });
  }

  const renderCard = (note: NoteRow) => (
    <NoteCard
      key={note.id}
      note={note}
      editedLabel={t("notes.edited", { date: dateFormat.format(new Date(note.updatedAt)) })}
      onOpen={(n) => modal.current?.show(n)}
      onTogglePin={togglePin}
      onToggleItem={toggleItem}
      onDelete={remove}
      t={t}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground/40">
            <SearchIcon />
          </span>
          <label htmlFor="notes-search" className="sr-only">
            {t("notes.search")}
          </label>
          <input
            ref={searchRef}
            id="notes-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("notes.searchPlaceholder")}
            className="min-h-11 w-full rounded-xl border border-foreground/15 bg-background py-2 pr-3 pl-9 text-base shadow-sm placeholder:text-foreground/40 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 focus:outline-none sm:text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => modal.current?.show()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          {t("notes.new")}
        </button>
      </div>

      {optimisticNotes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-foreground/20 px-6 py-16 text-center">
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-2xl">
            📝
          </span>
          <p className="text-base font-semibold">{t("notes.emptyTitle")}</p>
          <p className="max-w-sm text-sm text-foreground/60">{t("notes.emptyText")}</p>
          <button
            type="button"
            onClick={() => modal.current?.show()}
            className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
          >
            {t("notes.createFirst")}
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-foreground/20 px-6 py-12 text-center text-sm text-foreground/60">
          {t("notes.noResults", { query: query.trim() })}
        </p>
      ) : (
        <>
          <p className="-mt-3 text-xs text-foreground/50" aria-live="polite">
            {visible.length === 1 ? t("notes.countOne") : t("notes.count", { count: visible.length })}
          </p>
          <NoteGrid title={t("notes.pinned")} notes={pinned} render={renderCard} />
          <NoteGrid title={pinned.length > 0 ? t("notes.others") : undefined} notes={others} render={renderCard} />
          <NoteGrid title={t("notes.completed")} notes={completed} render={renderCard} />
        </>
      )}

      <NoteModal ref={modal} onDelete={remove} t={t} />
    </div>
  );
}
