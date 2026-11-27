# Notes Page

## Status

In Progress

## Goals

- New panel page `/notes` ("Notas" in the sidebar, under Panel) for every signed-in user of a company
- CRUD: create, list, edit and delete notes, each with a title, text, color and pin
- Notion-style checklist in a note: tick a task on the card or in the editor (struck through when done), progress "2/5 hechas", "Completada" badge and a "Completadas" section once every task is done
- Notes are private: each user sees only their own notes, in the company they act in
- Polished UI/UX: a card grid (pinned first, then newest edited), live search over title and text, colors, pin/unpin from the card, an empty state, a modal form (create / edit) with character counter, delete confirmation and success toasts
- Works on phones (one column, 16px inputs, 40px tap targets) and in light / dark mode

## Notes

- `Note` model: `companyId`, `userId`, `title` (≤ 120), `content` (≤ 5000), `items` (embedded `NoteItem` list), `color` (`NoteColor` enum), `pinned`, `createdAt`, `updatedAt`; a note needs a title, text or a task
- Server Actions in `src/actions/notes.ts` (`requireCompanyAccess`; another user's or company's note reads as "Note not found.")
- Pure search / sort in `src/lib/notes.ts` (unit tested)
- Run `npx prisma db push` after pulling
