# Current Feature

## Status

In Progress

## Goals

- When a sale record is created, automatically copy the grains of the last grain purchase day into today (same item, quantity and unit cost), like "Repetir último día" on Granos
- Only once per day: if today already has grain purchases, nothing is added (grains are shared evenly among the day's records, so copying per sale would multiply the cost)
- Works for any user who creates the record (seller or admin), no GRAINS permission needed

## Notes

- Shared helper `repeatLastGrainDay` in `src/lib/repeat-grain-day.ts`, used by `createDailyWorkRecord` and `repeatLastDayPurchases`
- Editing or deleting a sale record doesn't touch grains
