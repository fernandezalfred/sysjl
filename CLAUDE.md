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
- **Sign in `/login`** — Credentials + bcrypt + JWT sessions; deactivated users can't sign in; signing in goes to `/dashboard`. `src/actions/auth.ts`, `src/components/auth/`
- **Route protection** — `src/proxy.ts` (sign-in everywhere but `/` and `/login`, admin for `/admin/*`); every Server Action re-checks (`src/lib/auth/require-session.ts`, `require-admin.ts`)
- **Language switcher** — cookie-backed es/en. `src/actions/locale.ts`, `src/lib/i18n/`

### Panel shell (`src/app/(panel)/layout.tsx`, `src/components/layout/`)
- Sidebar (Panel, Mi cuenta; admin: Ingresos y egresos, Gestionar usuarios, Granos), phone drawer, breadcrumbs. `PanelShell`
- **Admin "Por pagar"** button: total owed to all sellers, dropdown per seller. `AdminPendingPay`, `pendingPayBySeller` in `src/lib/money/seller-pay.ts`
- **Seller pay bar**: Cobrado / Te falta cobrar / Ganancia total, with day counts. `SellerPayBar`

### Panel `/dashboard` (one page: charts + records + prices)
- Header: title and "● Actualizado · day, date · time" in Bolivia time
- **Sales charts** (top): sales per user by Día/Semana/Mes, by product for the selected day, sold + unsold over time. `src/components/sales-charts/`, `src/lib/sales-charts.ts`
- **Sale Records**: grouped by day (day header shows weekday, e.g. "Nov 12, 26 jueves", and the day's Neto − Pago for admins); every other day shaded; clicking a day header shows that day in the charts. Create / edit / delete in `<dialog>` modals. Pagination never splits a day (`src/lib/pagination.ts`). `src/components/sale-records/`, `src/actions/daily-work-records.ts`
  - Per row: Queso/Yogurt taken/left/sold, Leche y Mote (loser in red, admins see "Diferencia"), Total venta (daily winner in green), seller pay (Pago) pill — admin toggles Pagar / ✓ Pagado; Neto − Pago under the name for admins
  - Sellers see and edit only their own records
- **Prices & Costs** (admin, bottom): Queso/Yogurt sale price and purchase cost. `src/components/admin/product-pricing/`, `src/actions/product-prices.ts`

### Admin pages
- **Ingresos y egresos `/admin/finance`** — per day/week/month or "Desde el inicio" (total investment per product, Ganancia neta acumulada, running totals): income by product, costs, Neto, pay, result, per seller; charts; CSV / Excel / print-PDF reports. `src/lib/money/finance.ts`, `src/lib/reports.ts`, `src/components/finance/`
- **Gestionar usuarios `/admin/users`** — create, edit, deactivate/reactivate (with confirmation). `src/components/admin/users/`, `src/actions/admin-users.ts`
- **Granos `/admin/grains`** — grain purchases per day (Maíz pelado, Maíz con cáscara, Haba), "repeat last day". `src/components/admin/grain-purchases/`, `src/actions/stock-purchases.ts`, `src/lib/repeat-purchases.ts`

### Account
- **Mi cuenta `/account`** — change own password. `src/actions/account.ts`

### Money logic (pure, unit tested)
- Rows, winner/loser: `src/lib/daily-records.ts`
- Neto (net profit): `src/lib/money/revenue.ts`; cost inputs: `net-profit.ts`, `product-prices.ts`
- Seller pay tiers, paid/pending totals: `src/lib/money/seller-pay.ts`

### Shared UI behavior
- **Popups** (SweetAlert2) via `src/lib/alerts.ts`: `confirmAlert` before deletes and state changes, `successToast` after saves (`useSuccessToast`), `errorAlert` when a button action fails; form validation errors stay inline
- Dates: `src/lib/dates.ts` (`formatShortDate` with weekday, Bolivia business day)
