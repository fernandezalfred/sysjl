# Current Feature: Sale Records CRUD via Modal

## Status

In Progress

## Goals

- Add a `DailyWorkRecord` Prisma model: `userId` (relation to `User`), `date`, `quesoTaken`, `quesoRemaining`, `yogurtTaken`, `yogurtRemaining`, `createdAt`, `updatedAt`. One record per user per day (`@@unique([userId, date])`). Named `DailyWorkRecord` rather than `SaleRecord` to avoid colliding with the existing per-product-row `SaleRecord` TS type in `src/types/landing.ts`.
- Server Actions in `src/actions/daily-work-records.ts`: `createDailyWorkRecord`, `updateDailyWorkRecord` — both resolve the acting user from the server session (never trust a `userId` from the client), validate quantities (non-negative, remaining ≤ taken), and return the existing `{success, error}`/`{prevState, formData}` pattern used elsewhere.
- A vehicle user can open a modal (native `<dialog>`, matching the dependency-free pattern already decided for this project) to save a new day's record: quantities of Queso and Yogurt taken from the deposit and remaining at day's end.
- The same modal (pre-filled) lets a user edit one of their own existing records.
- A user can only create/edit their own records; the page that lists them shows only the signed-in user's history (admins can view all users' records already, per `project-overview.md` §3.1 — this feature doesn't need to change that view).
- Sold quantity and revenue are derived (`taken - remaining`), not stored directly, consistent with how `src/lib/landing-data.ts` already computes them from the mock dataset.
- Swap `getLandingPageData()` (`src/lib/landing-data.ts`) to read real `DailyWorkRecord` rows via Prisma instead of the typed mock dataset, now that real records exist to read. Keep the existing aggregation logic/shape as-is where possible so the already-tested per-product/per-user totals and the Sale Records view keep working — just change where the raw rows come from.
- Full regression pass: build, lint, `npm test`, and a live check (create a record as the vehicle user, edit it, confirm it appears correctly on the landing page).
- No delete action — the written goals only ever covered create + edit; "CRUD" in the title was imprecise. Confirmed with the user to keep it that way.

## Notes

- Confirmed with the user: this feature also performs the "one-file Prisma swap" for the landing page (see History) — `getLandingPageData()` moves off the mock dataset onto real `SaleRecord` rows, not deferred to a later feature.
- The "Merge Vehicle into User (Single Entity)" feature that was loaded previously is dropped — it was never started (no branch, no code changes), so there's nothing to revert and no history entry for it.
- Depends on knowing which user a record belongs to — reuses the existing `auth()`/session pattern from `src/lib/require-admin.ts` (a non-admin equivalent, just "require a signed-in user").

## History

- **Landing Page — Sales & Stock by User** — Replaced the Next.js starter page with a dashboard showing sold/remaining totals per product (Queso, Yogurt) and combined, per-user totals, and a Sale Records view (one row per user/day, merging that day's Queso and Yogurt entries) with a combined total revenue figure. Mobile-first, table-to-card responsive layout. Built against a typed mock dataset behind `getLandingPageData()` for a later one-file Prisma swap. Added Vitest with unit tests for the aggregation logic in `src/lib/landing-data.ts`.
- **Authentication (Login, Sessions, Role-Based Access)** — Set up Prisma 6 + MongoDB (User/Vehicle schema, Role enum) and Auth.js v5 with a Credentials provider: bcrypt password hashing, JWT sessions, role/assigned-vehicle resolved server-side and never trusted from the client. `src/proxy.ts` guards every route except `/login` and `/api/auth/*`. Added a login page/form, sign-out control, and a seed script for one admin and one vehicle user. Password recovery and email confirmation were explicitly deferred. Picked up Prisma's official AI-agent skills as a side effect of `prisma init`. Still open: no in-app UI for an admin to create new users (seed script only) — flagged as a candidate for a future feature.
- **Admin User & Vehicle Management** — Added `/admin/users`: admin-only page to create users, edit name/email/role/password, assign or unassign a vehicle (from existing vehicles — creating vehicle entities is a separate concern per `project-overview.md` §3.1), and deactivate/reactivate accounts (added `User.isActive`; deactivated users are rejected at sign-in). Every Server Action independently re-checks admin role server-side, and `src/proxy.ts` blocks non-admins from `/admin/*`. Fixed two bugs during implementation: a stale vehicle-assignment dropdown after save, and the fix for that breaking the "Saved." confirmation — resolved by splitting the form into a stable outer piece (owns save state) and a remountable inner fields piece (resyncs defaultValue). Known limitation: JWT sessions aren't revoked on deactivation — an already-signed-in user stays logged in until their token expires, though they can't sign in again.
