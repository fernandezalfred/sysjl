# Current Feature

Seller sees only their own records

## Status

In Progress

## Goals

- On `/dashboard`, a seller (non-admin) sees only their own records: Sale Records table and Sales by User charts.
- Also on `/` when signed in: top seller banner, charts and Totals by User show only the seller's own records (the banner only appears if they won their latest day).
- A seller sees their total earned pay (Pago over every day they worked, paid or not) and days worked in the Edit column's header of Sale Records and Totals by User; the header is pinned while scrolling. Table view only (not the phone cards).
- Admins still see every seller. Guests (signed out) on `/` still see every seller.
- The seller's row keeps its green (won) / red (lost) background, worked out against every seller of the day; the amounts stay admin-only.

## Notes

- Filtered on the server (`recordsVisibleTo` in `src/lib/daily-records.ts`, used by `src/app/(panel)/dashboard/page.tsx` and `src/app/page.tsx`), so other sellers' rows never reach the browser.
