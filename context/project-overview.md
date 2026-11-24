# Project Overview: SysJL — Daily Sales and Net Profit Tracker

## 1. What the App Does

SysJL tracks the daily sales of a small dairy distribution business in Bolivia (amounts in bolivianos, "Bs").

Each seller takes Queso and Yogurt from the central deposit in the morning, sells them during the day together with Milk and Mote, and reports at the end of the day what was left over and how much they sold in total. From those numbers the app works out each seller's sales, the value of what wasn't sold, the day's winner, the seller's pay and, for admins, the business's net profit.

The UI is in Spanish by default, with English as an option (cookie-backed language switcher).

## 2. Technology Stack

- Next.js 16 (App Router, Turbopack, Partial Prerendering) + React 19 + TypeScript (strict)
- Prisma 6 on MongoDB (replica set required; schema changes via `prisma db push`, no migrations)
- Auth.js v5: Credentials provider, bcrypt, JWT sessions
- Tailwind CSS v4 (CSS-based config in `src/app/globals.css`)
- Zod for input validation, SweetAlert2 for confirmations, success toasts and error popups, Chart.js (`react-chartjs-2`) for charts, Vitest for unit tests
- Installable as a PWA (manifest + a small service worker: build files and icons cached, pages and data always from the network, offline page)
- Deployed on Vercel

## 3. Roles and Access

The app is multi-company: each distribution company (branch) renting it has its own sellers, admins, sale records, prices and grain purchases (`companyId`), and never sees another company's data. There's no limit on companies or sellers.

| Role (`Role` enum) | Shown as             | Can do                                                                                                                         |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `SUPER_ADMIN`      | Super administrador  | Exactly one, belongs to no company. Every company: create, rename, deactivate, open one (switcher) and act in it as an admin with every module; create its admins and grant their permissions |
| `ADMIN`            | Administrador        | One company: see and edit every sale record, costs, Neto and pay; plus the modules the super admin granted: Ingresos y egresos (`FINANCE`), Gestionar usuarios (`USERS`, sellers only), Granos (`GRAINS`), Precios y costos (`PRICES`) |
| `VEHICLE_USER`     | Vendedor (Seller)    | Create and edit their own sale records, see their own pay and pending pay total, change their own password                      |
| Guest (signed out) | —                    | See the public landing page `/` (presents the product; no company data)                                                        |

Rules:

- The acting user and their company always come from the server-side session; a user or company id sent by the browser is never trusted (the super admin's company switcher choice is the one exception, and only for the super admin).
- The role, company and permissions are re-read from the database on every request, so a permission change, a deactivated user or a deactivated company applies right away (the user is signed out).
- `src/proxy.ts` requires sign-in everywhere except `/` and `/login`, an admin role for `/admin/*` and the super admin for `/admin/companies`; each admin page checks its permission. Every Server Action checks again on its own, and treats another company's data as not found.
- Costs, net profit and the winner's margin are admin-only (a seller sees the Milk liters and price they entered in their own record form; guests never receive them). Seller pay is shown to admins on every row and to a seller on their own rows (not to guests).
- Signing out goes to the landing page `/`. Signing in goes straight to `/dashboard` (also when a signed-in user opens `/login`; a non-admin opening `/admin/*` lands there too). On `/dashboard` a seller sees only their own records (charts, Sale Records). The public landing page `/` presents the product to the distribution companies that would rent it and shows no real data (its preview uses made-up figures).
- The admin marks each day's pay as paid (after a confirmation, can be undone); a paid Pago shows a green "Pagado" pill, an unpaid one a blue "Pagar" button (the pill itself marks it paid). The admin's panel header shows the total still owed to all sellers, with a dropdown of what each seller is owed; each owed seller has a red "Pagar de N días" button on their row (marks all their unpaid days as paid, after a warning) and each seller's last payment (a "Pagar todo" or a single day) can be undone once they're up to date (nothing owed), so the owed days come back. On every panel page, a seller sees in place of the breadcrumbs what they've collected (paid Pago), what they're still owed (unpaid Pago) and the sum of both (total earned), each with its number of days. In Sale Records each day's Pago is a green "Pagado" or amber "Por cobrar" badge.
- Deactivated users, and every user of a deactivated company, can't sign in; open sessions end on their next request.

## 4. Pages

| Route           | Who             | Content                                                                                                     |
| --------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| `/`             | Everyone        | Public product landing page for distribution companies: hero with a panel preview (made-up figures), features, roles (admin, sub-admin, seller), how it works, sign-in call to action |
| `/login`        | Everyone        | Sign in                                                                                                     |
| `/dashboard`    | Signed in       | Sales by User charts (day, week, month), Sale Records table with create / edit / delete, Prices & Costs (admin) at the bottom                                     |
| `/account`      | Signed in       | Change own password                                                                                         |
| `/admin/users`  | Admin (`USERS`) | The company's users: search, create, edit, deactivate; admins and their permissions by the super admin only |
| `/admin/companies` | Super admin  | Every company with its sellers, admins, and last 30 days' records and net profit after pay (Neto − Pago); create, rename, deactivate, open            |
| `/admin/finance` | Admin (`FINANCE`) | Ingresos y egresos, per day, week, month or since the beginning: each seller's Neto − Pago over the same number of days worked (their last N days, N = the fewest days any seller worked in the period), best first, to choose bonuses; boxes with the period's workers' earnings (Pago) and net profit after pay (Neto − Pago); the company's total Neto per period |
| `/admin/grains` | Admin (`GRAINS`) | Grain purchases (Maíz pelado, Maíz con cáscara, Haba)                                                       |

Clicking a day header in Sale Records shows that day in the charts at the top of `/dashboard`.

## 5. Products and Inputs

| Item                        | How it's recorded                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Queso, Yogurt               | Per sale record: units taken ("Sacó") and left over ("Sobró"). Sale price and purchase cost set by the admin on `/dashboard`. |
| Milk & Mote                 | No quantities. Their revenue is what's left of the seller's "Total venta" after Queso and Yogurt revenue.                    |
| Milk cost                   | Per sale record: liters taken × the price per liter it was bought at, entered by whoever registers the sale (required, 0 allowed). |
| Grains                      | Quartillas × cost per quartilla, per day. Deposit inputs only, never sold.                                                   |

The sale price and the purchase cost are snapshotted on each sale record when it's created, so a later change never rewrites past records. Records created before the purchase cost snapshot existed use the current purchase cost (if not set, the last recorded purchase cost is the fallback).

"Repeat last day" on the Grains page copies the most recent day's purchases into today.

A new grain purchase is always dated today; editing one can move it to another day (never a future one), keeping its time of day.

The business day for purchases is computed in Bolivia time (`America/La_Paz`).

## 6. Calculations (per sale record)

| Name (Spanish UI)              | Formula                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Vendió (Queso / Yogurt)        | taken − left, × the record's sale price                                                                                   |
| No vendidos                    | left × sale price, Queso + Yogurt                                                                                         |
| Total venta                    | entered by the seller (all four products)                                                                                 |
| Leche y Mote                   | Total venta − Queso revenue − Yogurt revenue                                                                              |
| Total vendidos más no vendidos | Total venta + No vendidos                                                                                                 |
| Ganador (daily winner)         | Highest "Total vendidos más no vendidos" of the day; needs 2+ records that day; ties share; margin = gap to the runner-up |
| Perdedor (loser)               | Everyone below the day's winner: Leche y Mote cell in red; admins see the gap to the winner as a negative amount ("-Bs 120") |
| Neto (admin)                  | Queso/Yogurt sold × (sale price − purchase cost) + Leche y Mote − the record's Milk liters × price per liter − an even share of that day's grains |
| Pago (seller pay)              | Bs 150 up to 2500 of Total venta; +10 per 100 from 2500 to 3000; +20 per 100 above 3000 (amount over 2500 rounded to the nearest 100) |
| Neto − Pago (admin)           | shown under the seller's name; display only                                                                               |

The day header shows the day's total of Neto − Pago over all its records (admins). Amounts are displayed in whole bolivianos. Each seller's grain share and Neto are calculated rounded to whole bolivianos; stored values keep their cents.

The logic lives in `src/lib/daily-records.ts` (rows, winner), `src/lib/money/revenue.ts` (net profit), `src/lib/money/seller-pay.ts` (pay) and `src/lib/money/net-profit.ts` (loading purchase and grain costs).

## 7. Data Model (`prisma/schema.prisma`)

- **Company** — name, `isActive`.
- **User** — name, email (unique across the app), bcrypt hash, role, `companyId` (null only for the super admin), `permissions` (admins), `isActive`.
- Every **DailyWorkRecord**, **ProductPrice** and **StockPurchase** has the `companyId` of its company.
- **DailyWorkRecord** — one per user per day: Queso/Yogurt taken and left, `totalSold`, Milk liters and price per liter (`milkLiters`, `milkUnitCost`), snapshotted sale prices and purchase costs (`quesoPurchaseCost`, `yogurtPurchaseCost`; null on older records), `payPaidAt` (when the admin marked the pay as paid) (every day paid by one "Pagar todo" shares it, so the last payment can be undone). A new record is dated today; editing one can move it to another day (never a future one, nor a day that seller already has a record for).
- **ProductPrice** — one row per company and priced product (Queso, Yogurt): current sale price and purchase cost, updated in place (no history).
- **StockPurchase** — a grain purchase: product, quantity, unit cost, who entered it (`createdBy`). Old Queso/Yogurt purchases are still stored but no longer shown.

## 8. Not Built (from the original spec)

These were in the first version of this document and are deliberately not implemented today:

- Central deposit stock tracking (current stock, preventing quantities greater than available stock).
- An inventory movement history.
- A history of price and cost changes (only the current value and who set it are kept).
- Vehicles as their own entity (removed; sellers are users).
- Per-company settings beyond prices (e.g. other expenses, own branding).
