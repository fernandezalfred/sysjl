"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { TaskCheckbox } from "@/components/notes/TaskCheckbox";
import type { TranslateFn } from "@/lib/i18n/translations";
import { NOTE_ITEM_MAX, NOTE_ITEMS_MAX, noteProgress, setItemDone, type NoteItem } from "@/lib/notes";

// A task id unique enough within one note (crypto.randomUUID needs HTTPS, which a
// phone on the local network doesn't have).
function newItemId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

interface ChecklistEditorProps {
  initialItems: NoteItem[];
  t: TranslateFn;
}

// The note's to-do list in the editor, Notion style: Enter adds a task below, Backspace
// on an empty task removes it. Sent with the form as JSON in the hidden "items" field.
export function ChecklistEditor({ initialItems, t }: ChecklistEditorProps) {
  const [items, setItems] = useState<NoteItem[]>(initialItems);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  // The task to focus once it is on screen (just added, or the one above a removed one).
  const focusId = useRef<string | null>(null);
  const { done, total } = noteProgress(items);

  useEffect(() => {
    if (!focusId.current) return;
    const input = inputs.current.get(focusId.current);
    focusId.current = null;
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }, [items]);

  function addAfter(index: number) {
    if (items.length >= NOTE_ITEMS_MAX) return;
    const item = { id: newItemId(), text: "", done: false };
    setItems((current) => [...current.slice(0, index + 1), item, ...current.slice(index + 1)]);
    focusId.current = item.id;
  }

  function remove(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
    const above = items[index - 1] ?? items[index + 1];
    if (above) focusId.current = above.id;
  }

  function setText(id: string, text: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, text } : item)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Enter") {
      event.preventDefault();
      addAfter(index);
    } else if (event.key === "Backspace" && event.currentTarget.value === "") {
      event.preventDefault();
      remove(index);
    }
  }

  return (
    <div className="flex flex-col gap-1 px-4 pb-2">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      {total > 0 ? (
        <p className="pb-1 text-xs font-medium text-foreground/50 tabular-nums">
          {t("notes.tasks")} · {t("notes.progress", { done, total })}
        </p>
      ) : null}

      <ul className="flex flex-col">
        {items.map((item, index) => (
          <li key={item.id} className="group/task flex min-h-9 items-center gap-2.5">
            <TaskCheckbox
              done={item.done}
              label={t(item.done ? "notes.taskUndone" : "notes.taskDone", { task: item.text || t("notes.taskPlaceholder") })}
              onToggle={() => setItems((current) => setItemDone(current, item.id, !item.done))}
            />
            <input
              ref={(node) => {
                if (node) inputs.current.set(item.id, node);
                else inputs.current.delete(item.id);
              }}
              type="text"
              value={item.text}
              maxLength={NOTE_ITEM_MAX}
              onChange={(event) => setText(item.id, event.target.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              placeholder={t("notes.taskPlaceholder")}
              aria-label={t("notes.tasks")}
              className={`min-w-0 flex-1 bg-transparent py-1 text-base placeholder:text-foreground/35 focus:outline-none sm:text-sm ${
                item.done ? "text-foreground/45 line-through decoration-foreground/40" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={t("notes.removeTask")}
              title={t("notes.removeTask")}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-foreground/40 hover:bg-foreground/10 hover:text-foreground sm:opacity-0 sm:group-focus-within/task:opacity-100 sm:group-hover/task:opacity-100"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {items.length < NOTE_ITEMS_MAX ? (
        <button
          type="button"
          onClick={() => addAfter(items.length - 1)}
          className="flex min-h-9 items-center gap-2.5 self-start rounded-md pr-2 text-sm text-foreground/50 hover:text-foreground"
        >
          <span aria-hidden="true" className="flex w-[18px] justify-center text-lg leading-none">
            +
          </span>
          {t("notes.addTask")}
        </button>
      ) : null}
    </div>
  );
}
