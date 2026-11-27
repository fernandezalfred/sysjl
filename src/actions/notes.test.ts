import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    note: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { createNote, deleteNote, setNoteItemDone, setNotePinned, updateNote } from "@/actions/notes";

const USER_ID = "aa0000000000000000000001";
const SESSION = { user: { id: USER_ID, role: "VEHICLE_USER", companyId: "c1", permissions: [] } };
const NOTE_ID = "bb0000000000000000000001";
const UPDATED_AT = new Date("2026-11-01T10:00:00Z");
const ITEMS = [
  { id: "t1", text: "Llamar", done: false },
  { id: "t2", text: "Pagar", done: false },
];
const NOTE = { id: NOTE_ID, companyId: "c1", userId: USER_ID, pinned: false, items: ITEMS, updatedAt: UPDATED_AT };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(SESSION);
});

describe("createNote", () => {
  it("requires sign-in", async () => {
    authMock.mockResolvedValue(null);
    const result = await createNote({ success: false }, formData({ title: "Hola" }));
    expect(result).toEqual({ success: false, error: "Sign-in required." });
    expect(prismaMock.note.create).not.toHaveBeenCalled();
  });

  it("saves a trimmed note for the acting user and company", async () => {
    const result = await createNote(
      { success: false },
      formData({ title: "  Pedido ", content: " Queso \n", color: "AMBER", pinned: "on" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.note.create).toHaveBeenCalledWith({
      data: { companyId: "c1", userId: USER_ID, title: "Pedido", content: "Queso", items: [], color: "AMBER", pinned: true },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/notes");
  });

  it("defaults to no color and not pinned", async () => {
    await createNote({ success: false }, formData({ content: "Solo texto" }));
    expect(prismaMock.note.create).toHaveBeenCalledWith({
      data: { companyId: "c1", userId: USER_ID, title: "", content: "Solo texto", items: [], color: "DEFAULT", pinned: false },
    });
  });

  it("saves the checklist, trimmed and without empty tasks", async () => {
    const items = JSON.stringify([
      { id: "t1", text: " Llamar ", done: true },
      { id: "t2", text: "   ", done: false },
    ]);
    const result = await createNote({ success: false }, formData({ items }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.note.create).toHaveBeenCalledWith({
      data: {
        companyId: "c1",
        userId: USER_ID,
        title: "",
        content: "",
        items: [{ id: "t1", text: "Llamar", done: true }],
        color: "DEFAULT",
        pinned: false,
      },
    });
  });

  it.each([
    [{ title: "  ", content: " " }, "Write a title, a note or a task."],
    [{ items: JSON.stringify([{ id: "t1", text: " ", done: false }]) }, "Write a title, a note or a task."],
    [{ title: "Hola", items: "not json" }, "Invalid input."],
    [{ title: "Hola", items: JSON.stringify([{ id: "t1", text: "a", done: "yes" }]) }, "Invalid input."],
    [{ items: JSON.stringify([{ id: "t1", text: "x".repeat(301), done: false }]) }, "A task is too long."],
    [{ items: JSON.stringify(Array.from({ length: 101 }, (_, i) => ({ id: `t${i}`, text: "a", done: false }))) }, "Too many tasks."],
    [{ title: "x".repeat(121) }, "Title is too long."],
    [{ content: "x".repeat(5001) }, "Note is too long."],
    [{ title: "Hola", color: "BLACK" }, "Invalid input."],
  ])("rejects %j", async (fields, error) => {
    const result = await createNote({ success: false }, formData(fields));
    expect(result).toEqual({ success: false, error });
    expect(prismaMock.note.create).not.toHaveBeenCalled();
  });
});

describe("updateNote", () => {
  it("updates the user's own note", async () => {
    prismaMock.note.findUnique.mockResolvedValue(NOTE);
    const result = await updateNote({ success: false }, formData({ noteId: NOTE_ID, title: "Nuevo", color: "SKY" }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.note.update).toHaveBeenCalledWith({
      where: { id: NOTE_ID },
      data: { title: "Nuevo", content: "", items: [], color: "SKY", pinned: false },
    });
  });

  it.each([
    ["a malformed id", "nope", NOTE],
    ["a missing note", NOTE_ID, null],
    ["another user's note", NOTE_ID, { ...NOTE, userId: "aa0000000000000000000002" }],
    ["another company's note", NOTE_ID, { ...NOTE, companyId: "c2" }],
  ])("refuses %s", async (_label, noteId, stored) => {
    prismaMock.note.findUnique.mockResolvedValue(stored);
    const result = await updateNote({ success: false }, formData({ noteId, title: "Nuevo" }));
    expect(result).toEqual({ success: false, error: "Note not found." });
    expect(prismaMock.note.update).not.toHaveBeenCalled();
  });
});

describe("setNotePinned", () => {
  it("pins without changing when it was last edited", async () => {
    prismaMock.note.findUnique.mockResolvedValue(NOTE);
    const result = await setNotePinned(NOTE_ID, true);
    expect(result).toEqual({ success: true });
    expect(prismaMock.note.update).toHaveBeenCalledWith({ where: { id: NOTE_ID }, data: { pinned: true, updatedAt: UPDATED_AT } });
  });

  it("rejects a non-boolean", async () => {
    const result = await setNotePinned(NOTE_ID, "yes" as unknown as boolean);
    expect(result).toEqual({ success: false, error: "Invalid input." });
    expect(prismaMock.note.findUnique).not.toHaveBeenCalled();
  });

  it("refuses another user's note", async () => {
    prismaMock.note.findUnique.mockResolvedValue({ ...NOTE, userId: "aa0000000000000000000002" });
    expect(await setNotePinned(NOTE_ID, true)).toEqual({ success: false, error: "Note not found." });
    expect(prismaMock.note.update).not.toHaveBeenCalled();
  });
});

describe("setNoteItemDone", () => {
  it("ticks one task, keeping the note's edit time", async () => {
    prismaMock.note.findUnique.mockResolvedValue(NOTE);
    const result = await setNoteItemDone(NOTE_ID, "t2", true);
    expect(result).toEqual({ success: true });
    expect(prismaMock.note.update).toHaveBeenCalledWith({
      where: { id: NOTE_ID },
      data: {
        items: [
          { id: "t1", text: "Llamar", done: false },
          { id: "t2", text: "Pagar", done: true },
        ],
        updatedAt: UPDATED_AT,
      },
    });
  });

  it("refuses a task the note doesn't have", async () => {
    prismaMock.note.findUnique.mockResolvedValue(NOTE);
    expect(await setNoteItemDone(NOTE_ID, "t9", true)).toEqual({ success: false, error: "Note not found." });
    expect(prismaMock.note.update).not.toHaveBeenCalled();
  });

  it("refuses another user's note", async () => {
    prismaMock.note.findUnique.mockResolvedValue({ ...NOTE, userId: "aa0000000000000000000002" });
    expect(await setNoteItemDone(NOTE_ID, "t1", true)).toEqual({ success: false, error: "Note not found." });
    expect(prismaMock.note.update).not.toHaveBeenCalled();
  });

  it("rejects a non-boolean", async () => {
    expect(await setNoteItemDone(NOTE_ID, "t1", 1 as unknown as boolean)).toEqual({ success: false, error: "Invalid input." });
    expect(prismaMock.note.findUnique).not.toHaveBeenCalled();
  });
});

describe("deleteNote", () => {
  it("deletes the user's own note", async () => {
    prismaMock.note.findUnique.mockResolvedValue(NOTE);
    expect(await deleteNote(NOTE_ID)).toEqual({ success: true });
    expect(prismaMock.note.delete).toHaveBeenCalledWith({ where: { id: NOTE_ID } });
  });

  it("checks the id before querying", async () => {
    expect(await deleteNote("nope")).toEqual({ success: false, error: "Note not found." });
    expect(prismaMock.note.findUnique).not.toHaveBeenCalled();
  });

  it("refuses another company's note", async () => {
    prismaMock.note.findUnique.mockResolvedValue({ ...NOTE, companyId: "c2" });
    expect(await deleteNote(NOTE_ID)).toEqual({ success: false, error: "Note not found." });
    expect(prismaMock.note.delete).not.toHaveBeenCalled();
  });
});
