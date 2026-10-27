# Current Feature

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## History

- **Landing Page — Sales & Stock by User** — Replaced the Next.js starter page with a dashboard showing sold/remaining totals per product (Queso, Yogurt) and combined, per-user totals, and a Sale Records view (one row per user/day, merging that day's Queso and Yogurt entries) with a combined total revenue figure. Mobile-first, table-to-card responsive layout. Built against a typed mock dataset behind `getLandingPageData()` for a later one-file Prisma swap. Added Vitest with unit tests for the aggregation logic in `src/lib/landing-data.ts`.
- **Authentication (Login, Sessions, Role-Based Access)** — Set up Prisma 6 + MongoDB (User/Vehicle schema, Role enum) and Auth.js v5 with a Credentials provider: bcrypt password hashing, JWT sessions, role/assigned-vehicle resolved server-side and never trusted from the client. `src/proxy.ts` guards every route except `/login` and `/api/auth/*`. Added a login page/form, sign-out control, and a seed script for one admin and one vehicle user. Password recovery and email confirmation were explicitly deferred. Picked up Prisma's official AI-agent skills as a side effect of `prisma init`. Still open: no in-app UI for an admin to create new users (seed script only) — flagged as a candidate for a future feature.
