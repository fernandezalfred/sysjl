# SysJL

Daily sales and net profit tracker for a small dairy distribution business in Bolivia (Bs). Next.js 16 + React 19 + Prisma 6 on MongoDB + Auth.js v5 + Tailwind v4. UI in Spanish (default) and English.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

Past features are summarized in `context/history.md` (read it only when you need the background of an earlier decision).

## Features (current state)

A map of what exists today and where it lives. `project-overview.md` has the rules and formulas; this is the quick index.

### Public and auth
- **Landing page `/`** — product page for distribution companies that would rent the app; made-up preview figures, no real data. `src/components/landing/`
- **Sign in `/login`** — Credentials + bcrypt + JWT sessions; deactivated users can't sign in; signing in goes to `/dashboard`, signing out to `/`. `src/actions/auth.ts`, `src/components/auth/`
- **Route protection** — `src/proxy.ts` (sign-in everywhere but `/` and `/login`, admin for `/admin/*`); every Server Action re-checks (`src/lib/auth/require-session.ts`, `require-admin.ts`)
- **Language switcher** — cookie-backed es/en. `src/actions/locale.ts`, `src/lib/i18n/`
- **Light / dark mode** — follows the OS until the user picks one with the sun/moon button (`ThemeToggle`: sidebar footer, landing nav, login); the choice is kept in `localStorage` and set as `data-theme` on `<html>` before the first paint (`THEME_INIT_SCRIPT` in the root layout). `src/lib/theme.ts`; the Tailwind `dark:` variant, `globals.css` dark rules, charts (`useIsDarkMode`) and SweetAlert popups all follow it
- **PWA** — installable (`src/app/manifest.ts`, opens `/dashboard`; icons in `public/icons/` and `src/app/apple-icon.png`, from the "JL" mark). `public/sw.js` (registered in production by `ServiceWorkerRegister`) caches only `/_next/static/*` and icons; pages and data always from the network, offline navigation shows `public/offline.html`. Bump `CACHE` in `sw.js` when changing it. Opening the installed app shows a full-screen progress bar (no logo) until the page has loaded (`LaunchProgress` in the panel layout, `standalone:` variant in `globals.css`); the phone's own splash before it is drawn by the OS. PWA files are left out of the proxy matcher; `sw.js` is sent with no-cache headers. "Instalar app" button in the sidebar footer (`InstallAppButton`, `src/lib/pwa/install-prompt.ts`): the browser's install prompt, or the Safari steps on iPhone/iPad; hidden once installed or where not installable

### Companies, roles and access (multi-company)
- `Company` model; every user (but the super admin), sale record, price and grain purchase has a `companyId`
- Roles: `SUPER_ADMIN` (exactly one, no company, every company), `ADMIN` (one company, modules in `permissions`: FINANCE, USERS, GRAINS, PRICES; Sale Records always), `VEHICLE_USER` (seller)
- Claims in the JWT, re-read from the DB on every session check (`src/auth.ts`, `src/lib/auth/claims.ts`, pure rules in `src/lib/auth/permissions.ts`)
- `src/lib/auth/access.ts`: `getAccess` (the company to act in: own company, or the super admin's switcher cookie), `requireCompanyAccess`, `requireAdminAccess(permission?)`, `requireSuperAdmin`, `requirePageAccess(permission?)`. Every query and action filters by `access.companyId`; another company's data reads as "not found"
- **Empresas `/admin/companies`** (super admin): companies with sellers, admins, last 30 days' records and net profit after pay (Neto − Pago); create, rename, deactivate, open. `src/actions/companies.ts`, `src/components/admin/companies/`, `src/lib/company-summaries.ts`
- Company switcher in the sidebar (super admin). `CompanySwitcher`
- Existing data: `prisma/migrate-to-companies.ts` (planned by `src/lib/company-migration.ts`)

### Panel shell (`src/app/(panel)/layout.tsx`, `src/components/layout/`)
- Sidebar (Panel, Mi cuenta; admin modules by permission: Ingresos y egresos, Gestionar usuarios, Granos; super admin: Empresas), company name or switcher, phone drawer, breadcrumbs. `PanelShell`
- Below `lg`: only the compact top row (menu, greeting/breadcrumbs, avatar) stays pinned and sets `--phone-bar-height`; the seller pay cards and "Por pagar" sit under it and scroll with the page
- **Admin "Por pagar"** button: total owed to all sellers, dropdown per seller with a red "Pagar de N días" button on the same row (marks all that seller's unpaid days as paid with one shared `payPaidAt`, `payAllPendingForSeller`) and "Deshacer último pago" once the seller is up to date (the days with the newest `payPaidAt`, `undoLastPayment`). `AdminPendingPay`, `pendingPayBySeller` in `src/lib/money/seller-pay.ts`
- **Seller pay bar**: Cobrado / Te falta cobrar / Ganancia total, with day counts. `SellerPayBar`

### Panel `/dashboard` (one page: charts + records + prices)
- Header: title and "● Actualizado · day, date · time" in Bolivia time
- **Sales charts** (top): sales per user by Día/Semana/Mes (grows and scrolls with many sellers), by product for the selected day, sold + unsold over time (generated colors past 8 sellers; legend toggles lines, top 8 shown first, `topTrendSeries`). `src/components/sales-charts/`, `src/lib/sales-charts.ts`
- **Sale Records**: grouped by day (day header shows weekday, e.g. "Nov 12, 26 jueves", and the day's Neto − Pago for admins); every other day shaded; clicking a day header shows that day in the charts. Create / edit / delete in `<dialog>` modals. Pagination never splits a day (`src/lib/pagination.ts`). `src/components/sale-records/`, `src/actions/daily-work-records.ts`
  - Per row: Queso/Yogurt taken/left/sold, Leche y Mote (loser in red, admins see the gap to the winner as a negative amount, e.g. "-Bs 120"), Total venta (daily winner in green), seller pay (Pago) pill — admin toggles Pagar / ✓ Pagado; Neto − Pago under the name for admins
  - A new record opens with Queso Sacó, Yogurt Sacó, Leche litros and Bs por litro from the last created record (the admin's: the company's, then the picked seller's own; `newRecordDefaults` in `src/lib/editable-record.ts`); everything else blank. With no records at all: Yogurt Sacó 24, Leche 30 litros, Bs 7 per liter
  - Sellers see and edit only their own records
  - A new record is dated today; editing one can change its date (not to a future day, nor to a day that seller already has)
- **Prices & Costs** (PRICES, bottom): Queso/Yogurt sale price and purchase cost. `src/components/admin/product-pricing/`, `src/actions/product-prices.ts`

### Admin pages
- **Ingresos y egresos `/admin/finance`** (FINANCE) — Día / Semana / Mes / Desde el inicio: sellers compared over the same number of days worked (each one's last N days, N = fewest days anyone worked in the period; Neto − Pago, best first) for bonuses; two boxes with the period's workers' earnings (Pago) and net profit after pay (Neto − Pago); the company's total Neto per period (area line). `src/lib/money/seller-comparison.ts`, `src/components/finance/`
- **Gestionar usuarios `/admin/users`** (USERS) — the company's users: search, pages of 20, create, edit, deactivate/reactivate (with confirmation); only the super admin creates/edits admins and ticks their permissions (`RoleFields`). `src/components/admin/users/`, `src/actions/admin-users.ts`, `src/lib/user-search.ts`
- **Granos `/admin/grains`** (GRAINS) — grain purchases per day (Maíz pelado, Maíz con cáscara, Haba), "repeat last day"; a new purchase is always today, editing one can change its date (not to a future day); every other day shaded. `src/components/admin/grain-purchases/`, `src/actions/stock-purchases.ts`, `src/lib/repeat-purchases.ts`

### Account
- **Mi cuenta `/account`** — change own password. `src/actions/account.ts`

### Money logic (pure, unit tested)
- Rows, winner/loser: `src/lib/daily-records.ts`
- Neto (net profit): `src/lib/money/revenue.ts`; cost inputs: `net-profit.ts`, `product-prices.ts`
- Seller pay tiers, paid/pending totals: `src/lib/money/seller-pay.ts`

### Shared UI behavior
- **Popups** (SweetAlert2) via `src/lib/alerts.ts`: `confirmAlert` before deletes and state changes, `successToast` after saves (`useSuccessToast`), `errorAlert` when a button action fails; form validation errors stay inline. A popup that needs a click goes inside the open `<dialog>` (a modal makes everything outside it inert), and Esc then closes only the popup (`useBackdropClose`). The sale record forms also warn in a popup: `useInvalidFormAlert` (empty/invalid fields named, `warningAlert`, then marked red via `data-checked`) and `useErrorAlert` (the action's error); fields with a value get a soft blue fill (`FIELD_STATE_CLASS`)
- Dates: `src/lib/dates.ts` (`formatShortDate` with weekday, Bolivia business day)
- The sale record modal and the sidebar use the black `.vertical-scroll` scrollbar (`src/app/globals.css`)
- **Phones**: 16px inputs and selects (no iOS zoom), 40px tap targets for main buttons, 44px drawer links; Sale Records and Granos switch to card views, and their modals are inset at `90dvh`; the sale record modal also fits the visible area above the keyboard (`useVisualViewportCssVars`: `--vv-height`, `--vv-top`), has a ✕ close button, and its Cancelar / Guardar registro buttons sit at the end of the form (not pinned). Charts can't use CSS breakpoints, so `useIsNarrowScreen` (below 640px, wide on the server) drops axis titles and uses smaller, fewer ticks (`amountAxis` / `categoryAxis(…, narrow)` in `src/components/finance/chart-style.ts`). Scrolling to the charts uses `--sticky-offset` so they land below the pinned bar
- Singular day labels ("1 día", "1 registro") use their own translation keys (`pay.dayOne`, `finance.recordOne`, `finance.comparisonHintOne`)

### Security and validation
- `src/lib/validation.ts`: shared Zod rules (ObjectId before every lookup by id, `DATE_KEY`, `NEW_PASSWORD` 8–72 bytes, `PERSON_NAME`, `EMAIL`, `firstIssue`)
- Server Actions return `ActionState` (`src/types/actions.ts`) and end with `catch (error) { return authErrorState(error); }`
- Sellers get their rows through `toSellerView` (no purchase costs or winner/loser margins); CSV cells that look like formulas are prefixed with `'`
- Security headers and `poweredByHeader: false` in `next.config.ts`; cookies `secure` in production
