# Current Feature: Project Update, Security Audit, Readability and Architecture

## Status

In Progress

## Goals

- **Update dependencies**: bring packages to their latest safe versions within the current majors (Next.js 16.4.6, React 19.3.1, Tailwind 4.3.5, Vitest 5.1.0, dotenv, etc.); major bumps (Prisma 7/8, ESLint 10, TypeScript 7, @types/node 26) only if proposed and approved separately
- **Dependency vulnerabilities**: `npm audit` reports 0 high/critical issues (today: 21 — 7 moderate, 14 high, incl. the vite/vitest/picomatch/tinyglobby chain and Next.js)
- **Code vulnerabilities**, checked across the whole app:
  - Every Server Action re-checks the session and role/permission (`requireCompanyAccess`, `requireAdminAccess(permission)`, `requireSuperAdmin`) and every admin page uses `requirePageAccess`
  - Every query and mutation filters by `access.companyId`; no company or user id is ever trusted from the browser (switcher cookie for the super admin only)
  - Every input validated with Zod (types, ranges, string lengths, ObjectId format)
  - No admin-only data (costs, Neto, margins, other sellers' pay) reaches a seller or guest, including in props passed to Client Components and in RSC payloads
  - Auth: bcrypt cost, login error messages don't reveal whether an email exists, deactivated users/companies are signed out, JWT claims re-read from the DB, cookie flags
  - No Prisma import in Client Components; no secrets in client bundles; CSV/Excel report formula injection; `src/proxy.ts` matcher covers every protected route
  - Security headers in `next.config.ts` where useful
- **Readability**: clearer names, split functions over ~50 lines, remove duplication, no dead code or unused translation keys, consistent patterns across actions and components
- **Architecture**: review module boundaries (`src/lib`, `src/actions`, `src/components`), shared access/validation helpers, data-loading layer per page; write up proposed changes before applying them
- `npm test`, `npm run lint` and `npm run build` pass; app verified in the browser; unit tests added/updated for any changed actions and utilities

## Notes

- The Next.js 16.4.3 → 16.4.6 security upgrade (with `experimental.agentUpgrade: "security"`) is already committed on branch `fix/next-16.4.6` (worktree `../sysjl-next-16.4.6`), not yet merged. Merge it first or build this feature on top of it
- The shell exports `NODE_ENV=development`, which breaks `next build` (`/_global-error` prerender error); build with `env -u NODE_ENV npm run build`
- Per `ai-interaction.md`: ask before large refactors or architectural changes — the architecture part starts as a written proposal, not a rewrite. Keep behavior identical; no new features
- Fix confirmed vulnerabilities first, then readability, then architecture, in separate focused commits
- Major-version dependency upgrades (Prisma, ESLint, TypeScript) may need code changes; keep them out of this feature unless approved
- Branch `feature/security-readability-architecture` is built on `fix/next-16.4.6`

## Progress

- **Dependencies (done)**: React 19.3.1, Tailwind 4.3.5, Vitest 5.1.0, dotenv 18.0.10 and other in-range updates; `deepmerge-ts` overridden to 8.0.2 (Prisma 6's config loader; `prisma validate`/`generate` work). `npm audit`: 21 → 16 high, all from `picomatch` ≤4.0.7 (no patched release exists; only used by ESLint/Vitest/typescript-eslint dev tooling, never shipped)
- **Security (done)**:
  - `src/lib/validation.ts`: shared Zod rules — ObjectId format before every lookup by id (malformed ids or objects from the browser no longer reach Prisma), real calendar day for a new sale record, password 8–72 bytes (bcrypt cuts at 72), name ≤100, email ≤254
  - Boolean arguments of `setUserActive`, `setCompanyActive`, `setRecordPayPaid` checked
  - Sign-in always runs bcrypt (stand-in hash for unknown emails), so timing doesn't reveal which emails exist
  - Sellers no longer receive `winnerMargin` / `lossMargin` in the RSC payload (`toSellerView`; new `isDailyLoser` keeps the red cell)
  - CSV report: text cells starting with `= + - @` tab/CR are prefixed with `'` (formula injection); Excel export already writes text as text
  - Cookies `secure` in production; security headers (`X-Frame-Options`, `frame-ancestors`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) and no `X-Powered-By`
  - Verified fine: every action/page access check, every query filtered by company, no Prisma in Client Components, no `dangerouslySetInnerHTML`, `.env*` ignored, no open redirect on `callbackUrl`
- **Readability (done)**: shared `ActionState` (`src/types/actions.ts`), `authErrorState` and `firstIssue` replace the same catch block / message expression in every action; one `withLeftNotOverTaken` for the create/update sale record schemas; one refresh helper per action file; dead `withoutMilkCost` removed; stale `revalidatePath("/")` calls and "Totals by User" / "guests" comments removed (the landing page has no data)

## Architecture proposal (not applied — needs approval)

1. **Split pure logic from data access in `src/lib`** — `daily-records.ts`, `money/product-prices.ts`, `money/stock.ts` mix pure functions with Prisma queries, so a Client Component importing a pure helper would bundle Prisma. Move queries to `src/lib/data/*.ts` with `import "server-only"` (build fails if a client imports them); keep the pure modules Prisma-free
2. **One data loader per page** — pages and the panel layout call Prisma directly (`dashboard`, `layout`, `grains`, `users`, `account`). Move those queries into `src/lib/data/` so pages only compose
3. **One auth module** — fold `require-session.ts` into `access.ts`; add `requireSuperAdminPage()` so `/admin/companies` uses the same guard style as the other pages
4. **Route constants** — `"/dashboard"`, `"/admin/grains"`… appear 70+ times across proxy, pages, actions and nav; one `src/lib/routes.ts`
5. **Split the largest client components** — `PanelShell` (391 lines), `SaleRecordsSection` (360), `GrainPurchasesSection` (235) into table / card / header pieces

## Security follow-ups (need a decision — would add behavior or schema fields)

- No sign-in rate limiting: unlimited password guesses per email/IP (needs a store, e.g. a `LoginAttempt` collection)
- Changing or resetting a password doesn't end the user's other open sessions (JWT); e.g. a `passwordChangedAt` field checked in `loadAccessClaims`
- Emails are case-sensitive (`Ana@x.com` and `ana@x.com` can be two users; sign-in needs the exact case); lowercasing needs a one-off migration of existing emails
- A seller can create a record for any date, including future ones
