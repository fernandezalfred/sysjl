# Current Feature

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## History

- **Landing Page — Sales & Stock by User** — Replaced the Next.js starter page with a dashboard showing sold/remaining totals per product (Queso, Yogurt) and combined, per-user totals, and a Sale Records view (one row per user/day, merging that day's Queso and Yogurt entries) with a combined total revenue figure. Mobile-first, table-to-card responsive layout. Built against a typed mock dataset behind `getLandingPageData()` for a later one-file Prisma swap. Added Vitest with unit tests for the aggregation logic in `src/lib/landing-data.ts`.
