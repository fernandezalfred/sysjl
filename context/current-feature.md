# Current Feature: Authentication (Login, Sessions, Role-Based Access)

## Status

In Progress

## Goals

- Add Prisma ORM with the MongoDB provider and a `DATABASE_URL` env var; wire up a Prisma client singleton (e.g. `src/lib/prisma.ts`) following Next.js conventions.
- Define a minimal Prisma schema to support auth: `User` (id, name, email, hashed password, role: `ADMIN` | `VEHICLE_USER`, timestamps) and `Vehicle` (id, name, assigned user), per `context/project-overview.md` §3. Full inventory/sales models are out of scope for this feature.
- Install and configure Auth.js (NextAuth) v5 with the Credentials provider, backed by the Prisma `User` table.
- Hash passwords with bcrypt (or argon2) — never store or compare plaintext passwords.
- Implement sign-in and sign-out: a login page/form (Server Action for submission, Zod-validated input) and a secure session (HTTP-only cookie).
- Enforce "only authenticated users can access the application" (`project-overview.md` §1): add server-side/middleware guards that redirect unauthenticated requests to the login page.
- Enforce role-based access on the server: expose the authenticated user's role (and assigned vehicle, for vehicle users) on the session so routes/Server Actions can gate admin-only vs vehicle-user data. Per §3, the assigned vehicle and user must be determined and validated server-side — never trust a user ID or vehicle ID supplied by the browser.
- Seed at least one admin user and one vehicle user (seed script or documented manual step) so login is testable end-to-end locally.
- **Explicitly out of scope for this pass:** password recovery / "forgot password" flow, and email confirmation / verification flow. No email-sending integration, and no placeholder links/pages for these deferred flows.

## Notes

- Decision: Auth.js (NextAuth) v5, Credentials provider — chosen over a custom session implementation.
- Decision: Prisma + MongoDB will be set up for real as part of this feature (not mocked). This is the first feature to introduce real persistence; the landing page feature still runs on a typed mock dataset and is unaffected by this work.
- **Prerequisite — needs a real `DATABASE_URL`:** Prisma's MongoDB connector requires a replica-set-enabled deployment (a bare single-node `mongod` won't work without enabling a replica set). Options: MongoDB Atlas (free tier), a local Docker replica set, or similar. I'll need a connection string, or a decision on how to stand one up, before this can be tested end-to-end — flag this at `start` if it isn't provided yet.
- Password hashing runs in the Node runtime (NextAuth's Credentials `authorize` callback), not the edge — fine for bcrypt/argon2; keep any edge middleware limited to checking session presence, not doing password verification itself.
- Keep existing conventions: Server Actions for the login form, Zod validation, `try/catch` + `{ success, data, error }` return shape per `context/coding-standards.md`.
- Don't build "Forgot password?" links or email-verification UI yet, per the explicit scope cut above.

## History

- **Landing Page — Sales & Stock by User** — Replaced the Next.js starter page with a dashboard showing sold/remaining totals per product (Queso, Yogurt) and combined, per-user totals, and a Sale Records view (one row per user/day, merging that day's Queso and Yogurt entries) with a combined total revenue figure. Mobile-first, table-to-card responsive layout. Built against a typed mock dataset behind `getLandingPageData()` for a later one-file Prisma swap. Added Vitest with unit tests for the aggregation logic in `src/lib/landing-data.ts`.
