# Current Feature: Landing Page — Sales & Stock by User

## Status

In Progress

## Goals

- Replace the default Next.js starter page (`src/app/page.tsx`) with the app's real landing page.
- Show individual sale records, each attributed to the user who recorded it (who sold/took the product).
- Show per-user totals: how much each user sold/took, per product (Queso, Yogurt) and combined.
- Show remaining stock per product (Queso, Yogurt) and the total value of remaining stock across both products.
- Show totals per product (Queso, Yogurt) and combined across both — matching `context/project-overview.md` §1 ("review daily totals for cheese and yogurt separately and together").
- Mobile-first, UI-friendly layout (carried over from the prior landing-page attempt): no horizontal scrolling, clear hierarchy, responsive table-to-card collapse.

## Notes

- Prices (per `context/project-overview.md` §1 — admin-only, same price per unit for Queso):
  - Queso: 9 (Bs) per unit
  - Yogurt: 33 (Bs) per unit
- "Left by which user" = which user recorded/removed the stock (the sale's `recordedByUserId`/`recordedByName`), not a separate concept from the sale record itself.
- "Total from left products" = total remaining stock, both as quantity per product and as a combined remaining-stock value (quantity × current price).
- Dependency gap carried over from the previous attempt: Prisma/`@prisma/client` are not installed, no `DATABASE_URL`/`.env`, no auth or seed data exist yet. Build against a typed mock dataset shaped like the Prisma models, behind a small data-fetching function, so swapping in real Prisma queries later is a one-file change.
- `next.config.ts` has `cacheComponents` enabled: any data access that depends on "now" must call `await connection()` (from `next/server`) and live behind a `<Suspense>` boundary, or `next build` fails with a prerender error.
- Keep using existing repo conventions: Tailwind v4 (`@theme` in `globals.css`, no config file), App Router/server components by default, `@/*` import alias.

## History
