# Current Feature

## Status

In Progress

## Goals

- In the admin "Por pagar" dropdown, each seller who is owed something gets a red "Pagar de N días" button on their row ("Pagar de 1 día" for one day), then the amount
- After a confirmation (seller, amount, days), it marks every unpaid day of that seller as paid (`payPaidAt` = now)
- New Server Action `payAllPendingForSeller(userId)`: admin only, ObjectId check, only that company's records (another company's seller updates nothing), success toast / error popup

- "Pagar todo" is a danger action: red outline button with a warning icon, warning confirmation
- Undo: only a seller who is up to date (nothing owed) and has a paid day shows "Deshacer último pago: Bs X · N días"; `undoLastPayment(userId)` puts the days of their most recent payment (a "Pagar todo" or a single day) back as unpaid, one payment at a time, newest first; the action refuses while the seller has unpaid days

- New sale record defaults: Yogurt Sacó 24, Leche 30 litros (price per liter stays 7)
- Phones: the sale record modal's Cancelar / Guardar registro stays pinned to its bottom, and the modal fits the visible part of the screen above the keyboard (it used to hide the Save button while typing Total venta)
- Sale record form fields with a value get a soft blue fill and a clear focus ring
- Incomplete form: one popup names the empty/invalid fields (e.g. "Yogurt – Sacó"), they turn red and the first is focused; a server error also shows in a popup (still inline too)

## Notes

- No new field: "Pagar todo" gives every day the same `payPaidAt`, so the last payment = the days with the newest `payPaidAt` (works for payments made before this feature too)
- Unpaid days usually have `payPaidAt` unset (not null) in MongoDB, so the filter is `OR: [{ payPaidAt: null }, { payPaidAt: { isSet: false } }]`
- The actions revalidate the whole panel layout ("Por pagar" is on every panel page)
