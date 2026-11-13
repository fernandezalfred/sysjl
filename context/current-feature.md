# Current Feature

SweetAlert2 alerts, "Neto" label, weekday in dates

## Status

In Progress

## Goals

- Use SweetAlert2 (`sweetalert2`) for every confirmation, success notice and action error, in the user's language and following the OS light/dark theme (`theme: "auto"`), styled with Tailwind (`buttonsStyling: false`). Helpers in `src/lib/alerts.ts` (`confirmAlert`, `successToast`, `errorAlert`); `topLayer: true` so they show above the open `<dialog>` modals.
- Confirmations replace `window.confirm`: delete record, delete grain purchase (red "Sí, eliminar"), mark pay paid / not paid, repeat last day. New: deactivate / reactivate a user (`ToggleUserActiveButton`).
- Success toasts (top right, close on their own) replace the custom `ToastProvider` (removed with `toast-queue.ts` and its test) and the inline green success text on the price, create user, edit user and change password forms; also after marking pay, repeating the last day and (de)activating a user.
- Errors of button actions (pay toggle, delete, repeat last day, (de)activate) show an error alert instead of inline red text. Form validation errors stay inline under the fields (fields keep their values).
- "Ganancia neta" is now "Neto" everywhere in the UI, with matching grammar ("el neto", "del Neto"); English labels "Net profit" → "Net".
- Short dates (Sale Records day headers, record form, grain purchase days, pay confirmation) end with the day of the week in the user's language: "Nov 12, 26 jueves" (`formatShortDate(isoDate, t)`, `weekday.0`–`weekday.6` keys).
- Sale Records: every other day is shaded (table rows and the phone cards' day block), so one day's records are easy to tell from the next (`dayShadeClass`).
- Pagination (Sale Records, Grains) never splits a day across pages: a page takes whole days until it has at least 10 records, so the day that reaches the limit stays complete there (the page rounds up) and the next day starts the next page (`paginateGroups`).
- The Gráficos page (`/charts`) is merged back into the Panel (`/dashboard`): the Sales by User charts sit at the top of the panel again, `/charts` and its sidebar entry are removed, and clicking a day header in Sale Records shows that day in the charts and scrolls up to them (`DayHeaderButton`, replaces `DayHeaderLink`).
- Panel order: charts, Sale Records, then Prices & Costs (admin) at the very bottom.
- Charts on the Panel are packed tighter (smaller gaps between and inside the charts) with short titles: no section title (only an aria-label), "Ventas por usuario", "Por producto · {date}", "Vendidos + no vendidos en el tiempo".

## Notes

- Requested in English: "add sweat alert in all necesary situation". The user chose to replace the existing toasts too.
