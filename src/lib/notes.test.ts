import { describe, expect, it } from "vitest";
import { filterNotes, noteProgress, setItemDone, sortNotes, type NoteRow } from "@/lib/notes";

function note(id: string, overrides: Partial<NoteRow> = {}): NoteRow {
  return {
    id,
    title: "",
    content: "",
    items: [],
    color: "DEFAULT",
    pinned: false,
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("sortNotes", () => {
  it("lists pinned notes first, then the most recently edited", () => {
    const notes = [
      note("old", { updatedAt: "2026-11-01T10:00:00.000Z" }),
      note("pinnedOld", { pinned: true, updatedAt: "2026-10-01T10:00:00.000Z" }),
      note("new", { updatedAt: "2026-11-05T10:00:00.000Z" }),
      note("pinnedNew", { pinned: true, updatedAt: "2026-11-02T10:00:00.000Z" }),
    ];
    expect(sortNotes(notes).map((n) => n.id)).toEqual(["pinnedNew", "pinnedOld", "new", "old"]);
  });

  it("doesn't change the list it was given", () => {
    const notes = [note("a"), note("b", { pinned: true })];
    sortNotes(notes);
    expect(notes.map((n) => n.id)).toEqual(["a", "b"]);
  });
});

describe("filterNotes", () => {
  const notes = [
    note("cafe", { title: "Comprar Café", content: "dos kilos" }),
    note("queso", { title: "Pedido", content: "Queso para el lunes" }),
    note("tareas", { title: "Hoy", items: [{ id: "1", text: "Llamar al proveedor", done: false }] }),
  ];

  it("keeps every note for an empty or blank query", () => {
    expect(filterNotes(notes, "")).toHaveLength(3);
    expect(filterNotes(notes, "   ")).toHaveLength(3);
  });

  it("matches the title or the text, ignoring case and accents", () => {
    expect(filterNotes(notes, "cafe").map((n) => n.id)).toEqual(["cafe"]);
    expect(filterNotes(notes, "QUESO").map((n) => n.id)).toEqual(["queso"]);
  });

  it("matches the tasks' text", () => {
    expect(filterNotes(notes, "proveedor").map((n) => n.id)).toEqual(["tareas"]);
  });

  it("needs every word, in any order", () => {
    expect(filterNotes(notes, "lunes pedido").map((n) => n.id)).toEqual(["queso"]);
    expect(filterNotes(notes, "lunes café")).toEqual([]);
  });
});

describe("noteProgress", () => {
  it("counts done tasks; complete only when every task is done", () => {
    expect(noteProgress([])).toEqual({ done: 0, total: 0, complete: false });
    expect(
      noteProgress([
        { id: "1", text: "a", done: true },
        { id: "2", text: "b", done: false },
      ]),
    ).toEqual({ done: 1, total: 2, complete: false });
    expect(noteProgress([{ id: "1", text: "a", done: true }])).toEqual({ done: 1, total: 1, complete: true });
  });
});

describe("setItemDone", () => {
  it("ticks only the given task", () => {
    const items = [
      { id: "1", text: "a", done: false },
      { id: "2", text: "b", done: false },
    ];
    expect(setItemDone(items, "2", true)).toEqual([
      { id: "1", text: "a", done: false },
      { id: "2", text: "b", done: true },
    ]);
    expect(items[1].done).toBe(false);
  });
});
