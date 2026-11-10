# Current Feature

Milk purchase: editable date on edit

## Status

In Progress

## Goals

- Creating a Milk purchase shows no date input (it's stamped with today, Bolivia time) — unchanged.
- Editing a Milk purchase shows a date input, prefilled with the purchase's day, so the admin can move it to another day.
- The new day can't be in the future (Bolivia time). The purchase keeps its time of day; only the day changes, so it moves to that day's group and that day's net profit.
- Editing a Milk purchase also lets the admin change the user it is for (active users only).
- Grain purchases are unchanged (no date input or user on edit).

## Notes

- A purchase's day is its `createdAt` in `America/La_Paz`; editing the date shifts `createdAt` by whole days (Bolivia has no DST).

---

# Seller pay: own pay, pending total, paid (struck through)

## Status

In Progress

## Goals

- A seller (non-admin) sees the Pago only on their own rows (name column); other sellers' rows show only the name. Admins still see every row. Guests see no pay.
- On `/dashboard`, above Sale Records, a seller sees their pending pay: the sum of Pago over their days not yet paid, and how many days.
- The admin marks each day's pay as paid ("Marcar pagado") after a confirmation, and can undo it. A paid Pago is shown struck through (Sale Records and Totals by User) and no longer counts in the pending total.

## Notes

- New optional field `DailyWorkRecord.payPaidAt` (null = not paid); existing records read as unpaid.
- Marking paid is admin-only (`setRecordPayPaid` in `src/actions/daily-work-records.ts`).
- Ganancia neta − Pago and the day totals are unchanged by paid/unpaid.
- "Marcar pagado" sits in the Leche y Mote column (Sale Records).
- The "Ganador" badge is gone from Leche y Mote (both tables). The winner's Total cell stays green; a loser's Leche y Mote cell is red and admins see "Perdió por Bs X" (gap to the winner).
