# Current Feature

Edit a sale record's date

## Status

In Progress

## Goals

- The edit form of a sale record has a date field (prefilled with the record's day)
- Saving moves the record to that day; never a future day (Bolivia business day), nor a day the same seller already has a record for ("You already have a record for this date.")
- A new record is still always dated today; prices, costs and pay status stay as they were

- Record modal UX: confirmations/warnings/errors show and respond above the open modal (were inert behind it on desktop until the modal closed); Esc with a popup open closes only the popup; ✕ close button; Cancelar / Guardar at the end of the form on phones (no sticky bar); buttons disabled while saving or deleting

## Notes

- `updateDailyWorkRecord` in `src/actions/daily-work-records.ts`; `RecordFormFields` (`DateField`)
- Same rule as editing a grain purchase's date
