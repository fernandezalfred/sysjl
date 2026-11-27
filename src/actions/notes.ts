"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authErrorState, requireCompanyAccess, type Access } from "@/lib/auth/access";
import { NOTE_COLORS, NOTE_CONTENT_MAX, NOTE_ITEM_MAX, NOTE_ITEMS_MAX, NOTE_TITLE_MAX, setItemDone } from "@/lib/notes";
import { firstIssue, objectIdSchema } from "@/lib/validation";
import type { ActionState } from "@/types/actions";

const NOT_FOUND = "Note not found.";
const noteIdSchema = objectIdSchema(NOT_FOUND);

const noteItem = z.object(
  {
    id: z.string("Invalid input.").min(1, "Invalid input.").max(40, "Invalid input."),
    text: z.string("Invalid input.").trim().max(NOTE_ITEM_MAX, "A task is too long."),
    done: z.boolean("Invalid input."),
  },
  "Invalid input.",
);

const noteFields = z
  .object({
    title: z.string().trim().max(NOTE_TITLE_MAX, "Title is too long."),
    content: z.string().trim().max(NOTE_CONTENT_MAX, "Note is too long."),
    // Tasks left empty in the editor are dropped.
    items: z
      .array(noteItem, "Invalid input.")
      .transform((items) => items.filter((item) => item.text !== ""))
      .pipe(z.array(noteItem).max(NOTE_ITEMS_MAX, "Too many tasks.")),
    color: z.enum(NOTE_COLORS, "Invalid input."),
  })
  .refine((note) => note.title !== "" || note.content !== "" || note.items.length > 0, "Write a title, a note or a task.");

// The checklist comes as JSON in a hidden field; anything unreadable fails validation.
function parseItems(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw === "") return [];
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readFields(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    content: formData.get("content") ?? "",
    items: parseItems(formData.get("items")),
    color: formData.get("color") ?? "DEFAULT",
  };
}

function refreshNotes() {
  revalidatePath("/notes");
}

// The acting user's own note in the company they act in; anyone else's is "not found".
async function findOwnNote(access: Access, noteId: unknown) {
  if (!noteIdSchema.safeParse(noteId).success) return null;
  const note = await prisma.note.findUnique({ where: { id: noteId as string } });
  if (!note || note.userId !== access.userId || note.companyId !== access.companyId) return null;
  return note;
}

export async function createNote(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const access = await requireCompanyAccess();
    const parsed = noteFields.safeParse(readFields(formData));
    if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

    await prisma.note.create({
      data: {
        companyId: access.companyId,
        userId: access.userId,
        ...parsed.data,
        pinned: formData.get("pinned") === "on",
      },
    });

    refreshNotes();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function updateNote(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const access = await requireCompanyAccess();
    const parsed = noteFields.safeParse(readFields(formData));
    if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

    const note = await findOwnNote(access, formData.get("noteId"));
    if (!note) return { success: false, error: NOT_FOUND };

    await prisma.note.update({
      where: { id: note.id },
      data: { ...parsed.data, pinned: formData.get("pinned") === "on" },
    });

    refreshNotes();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function setNotePinned(noteId: string, pinned: boolean): Promise<ActionState> {
  try {
    const access = await requireCompanyAccess();
    if (typeof pinned !== "boolean") return { success: false, error: "Invalid input." };

    const note = await findOwnNote(access, noteId);
    if (!note) return { success: false, error: NOT_FOUND };

    // Pinning isn't an edit: keep updatedAt so the note stays where it was among its group.
    await prisma.note.update({ where: { id: note.id }, data: { pinned, updatedAt: note.updatedAt } });

    refreshNotes();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

// Ticks or unticks one task from the card. Like pinning, it keeps the note's edit time.
export async function setNoteItemDone(noteId: string, itemId: string, done: boolean): Promise<ActionState> {
  try {
    const access = await requireCompanyAccess();
    if (typeof itemId !== "string" || typeof done !== "boolean") return { success: false, error: "Invalid input." };

    const note = await findOwnNote(access, noteId);
    if (!note || !note.items.some((item) => item.id === itemId)) return { success: false, error: NOT_FOUND };

    await prisma.note.update({
      where: { id: note.id },
      data: { items: setItemDone(note.items, itemId, done), updatedAt: note.updatedAt },
    });

    refreshNotes();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}

export async function deleteNote(noteId: string): Promise<ActionState> {
  try {
    const access = await requireCompanyAccess();
    const note = await findOwnNote(access, noteId);
    if (!note) return { success: false, error: NOT_FOUND };

    await prisma.note.delete({ where: { id: note.id } });

    refreshNotes();
    return { success: true };
  } catch (error) {
    return authErrorState(error);
  }
}
