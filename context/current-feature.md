# Current Feature

Seller's pay totals in place of the breadcrumbs

## Status

In Progress

## Goals

- For a seller (non-admin), the panel's breadcrumb bar (where "Resumen / Panel" shows today) shows instead their total earned pay (Pago over every day they worked) with the days worked, and the pay still owed (not marked paid) with its days. On every panel page, phone and desktop.
- Admins keep the breadcrumbs.
- On `/dashboard` the "Tu pago pendiente" box and the total in the Sale Records Edit header are removed (now in the bar). Totals by User on `/` keeps its header total (that page has no panel bar).

## Notes

- Computed on the server in `src/app/(panel)/layout.tsx` from the seller's own records (`totalSellerPay`, `pendingSellerPay`).
