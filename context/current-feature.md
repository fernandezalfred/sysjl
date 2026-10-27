# Current Feature: Admin User & Vehicle Management

## Status

In Progress

## Goals

- Admin-only page (e.g. `/admin/users`) listing all user accounts: name, email, role, assigned vehicle, active/inactive status.
- Admin can create a new user: name, email, password, role (`ADMIN` or `VEHICLE_USER`). Password is hashed with the existing `hashPassword` utility; the admin sets the initial password directly and shares it out-of-band — no invite/confirmation email (that flow is still deferred, per the auth feature).
- Admin can edit an existing user's name, email, and role.
- Admin can assign or unassign a vehicle to a `VEHICLE_USER` (one user per vehicle — enforced by the existing `Vehicle.userId` unique constraint). Per `project-overview.md` §3.1, the admin's job here is managing the *assignment* ("Create, edit, and deactivate vehicle assignments. Assign one user to each vehicle."), not creating vehicle entities — no inline "create a vehicle" input. Vehicles are assumed to already exist (seed data today; a dedicated vehicle-management feature can add real CRUD later if needed).
- Admin can deactivate a user account (soft-deactivate, not delete), so a departed driver loses access without losing their historical record attribution. Requires adding an `isActive` field to the Prisma `User` model. A deactivated user must be blocked from signing in.
- Admin can reactivate a deactivated user.
- Every action above must be server-validated as admin-only, reusing the existing session's `role` (`src/auth.ts` / `src/proxy.ts`) — a non-admin hitting these routes or Server Actions directly must be rejected, not just hidden in the UI.
- Mobile-first, responsive layout matching existing conventions (table-to-card collapse, no horizontal scroll).

## Notes

- Builds directly on the just-completed Authentication feature: reuses Prisma, `hashPassword`, the `Role` enum, and the `User`/`Vehicle` schema.
- Explicitly out of scope for this pass: password reset/recovery for users, invite/confirmation emails (both still deferred from the auth feature), creating/editing/deleting vehicle entities themselves (only the user↔vehicle assignment is managed here, per `project-overview.md` §3.1), and audit/history logging of admin changes — `project-overview.md`'s "auditable process" is about correcting sales/inventory records, not user-management changes; can revisit if the business wants that here too.
- `/admin/*` is a new protected area — needs its own guard beyond "is authenticated" (role check), since `src/proxy.ts` today only checks session presence, not role.

## History

- **Landing Page — Sales & Stock by User** — Replaced the Next.js starter page with a dashboard showing sold/remaining totals per product (Queso, Yogurt) and combined, per-user totals, and a Sale Records view (one row per user/day, merging that day's Queso and Yogurt entries) with a combined total revenue figure. Mobile-first, table-to-card responsive layout. Built against a typed mock dataset behind `getLandingPageData()` for a later one-file Prisma swap. Added Vitest with unit tests for the aggregation logic in `src/lib/landing-data.ts`.
- **Authentication (Login, Sessions, Role-Based Access)** — Set up Prisma 6 + MongoDB (User/Vehicle schema, Role enum) and Auth.js v5 with a Credentials provider: bcrypt password hashing, JWT sessions, role/assigned-vehicle resolved server-side and never trusted from the client. `src/proxy.ts` guards every route except `/login` and `/api/auth/*`. Added a login page/form, sign-out control, and a seed script for one admin and one vehicle user. Password recovery and email confirmation were explicitly deferred. Picked up Prisma's official AI-agent skills as a side effect of `prisma init`. Still open: no in-app UI for an admin to create new users (seed script only) — flagged as a candidate for a future feature.
