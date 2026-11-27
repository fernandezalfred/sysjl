# Current Feature: Seller Advances (Adelantos)

## Status

In Progress

## Goals

- Advances are managed from the "Por pagar" dropdown (the separate "Adelantos" button and menu were removed at the user's request): its header shows the total of all advances with a "+" icon to add one (seller picked in the form)
- Each seller's row shows the whole name (wrapping, never cut); the icons sit right after the name, on its line: "+" (add an advance for them) and a list icon with the count, which opens a modal titled "Adelantos de {name}": Fecha, Cantidad, Descripción, Editar / Eliminar per row, the seller's total, and "Agregar adelanto"
- Full CRUD for admins (any admin, like "Por pagar"); every action company-scoped
- Every owed seller shows the same badge (with no advance: "350 − 0 = 350 Bs", the 0 muted), and each row packs name, "Pagar", "=" and the amount together; with advances it is the subtraction on the same line as one badge, e.g. "350 − 200 = 150 Bs" ("Bs" only after the final amount; each number on its own color, the advance in amber; "−" and "=" in small circles centered on the seam between two colors), and "· adelanto Bs 200" next to the days; no checkbox or toggle
- "Pagar" always pays the days and the advances together (both leave the menu); the confirmation shows what's handed over
- "Deshacer último pago" brings back both the days and the advances of that payment (whatever that payment included); once the seller is given a new advance (pending), the last payment can't be undone any more: the menu shows "Al día" and the server refuses it

## Notes

- New advances for any active worker of the company, sellers and admins alike (an admin also works and is paid); a former worker with advances still shows in the list

- New `PayAdvance` model (companyId, userId, date, amount in whole Bs, description, createdById); needs `npx prisma db push`
- `settledAt` on the advance = the days' `payPaidAt` of the payment that paid it off; undoing that payment clears it. Settled advances are hidden and can't be edited or deleted
- Single-day "Pagar" pills in Sale Records never touch advances; the pay button reads just "Pagar" (the days are on the line below and in its tooltip) and the amounts are compact so the row fits
- Actions `src/actions/pay-advances.ts`, grouping `src/lib/money/pay-advances.ts`, UI `src/components/layout/advances/`
