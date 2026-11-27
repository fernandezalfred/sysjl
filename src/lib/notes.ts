// Notes page logic, Prisma-free so the client can use it.

export const NOTE_COLORS = ["DEFAULT", "AMBER", "SKY", "EMERALD", "ROSE", "VIOLET"] as const;
export type NoteColorName = (typeof NOTE_COLORS)[number];

export const NOTE_TITLE_MAX = 120;
export const NOTE_CONTENT_MAX = 5000;
export const NOTE_ITEM_MAX = 300;
export const NOTE_ITEMS_MAX = 100;

// A task in a note's checklist.
export interface NoteItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  items: NoteItem[];
  color: NoteColorName;
  pinned: boolean;
  // ISO timestamp of the last edit.
  updatedAt: string;
}

// Lowercase without accents, so "cafe" finds "Café".
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

// Pinned notes first, then the most recently edited.
export function sortNotes(notes: NoteRow[]): NoteRow[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export interface NoteProgress {
  done: number;
  total: number;
  // Has tasks and every one is done.
  complete: boolean;
}

export function noteProgress(items: NoteItem[]): NoteProgress {
  const done = items.filter((item) => item.done).length;
  return { done, total: items.length, complete: items.length > 0 && done === items.length };
}

// `items` with task `itemId` ticked or unticked (the others as they were).
export function setItemDone(items: NoteItem[], itemId: string, done: boolean): NoteItem[] {
  return items.map((item) => (item.id === itemId ? { ...item, done } : item));
}

// The notes whose title, text or tasks contain every word of `query` (any order, ignoring
// case and accents). An empty query keeps them all.
export function filterNotes(notes: NoteRow[], query: string): NoteRow[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return notes;
  return notes.filter((note) => {
    const text = normalize([note.title, note.content, ...note.items.map((item) => item.text)].join(" "));
    return words.every((word) => text.includes(word));
  });
}
