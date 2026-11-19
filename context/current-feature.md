# Current Feature: Seller Contribution Comparison (Equal Days) on Income & Expenses

## Status

In Progress

## Goals

- First, clear the page: everything on `/admin/finance` removed (tiles, tables, charts, period switcher, CSV / Excel / print reports), with its code, tests, translations and `write-excel-file`; route, sidebar link, FINANCE permission and title kept — done
- On the Income & Expenses page `/admin/finance` (FINANCE), add a chart that tracks how much each seller made the company earn, so the admin can pick the best seller and give bonuses fairly
- Compare sellers over the **same number of days worked**: N = the fewest days worked by any seller in the selected range; each seller counts only their **last N days worked** (e.g. Pepito 8 days, Juan 4 → Pepito's last 4 vs Juan's 4)
- The per-seller figure is the Neto shown in the Sale Records user column (Neto − Pago, under the seller's name), summed over those N days
- All sellers in one chart, ranked best first; shows N ("comparing each seller's last N days worked")
- Works for Day / Week / Month (and "Since the beginning"): the range is the selected period
- Two boxes for the chosen period (all records, every day counted): workers' earnings (sum of each day's Pago, paid or not, with each worker's Pago and days listed inside) and net profit after workers' pay (Neto − Pago, with what each worker made the company earn listed inside, best first) — `buildPeriodTotals`, `PeriodTotalsBoxes`
- A second chart: the company's total Neto over time, per day / week / month (same period switcher)
- Pure calculation in `src/lib/money/seller-comparison.ts` (Prisma-free), unit tested; all text in es/en

## Notes

- Request (inline via `/feature load`, originally in Spanish): "track how much each worker made the company earn… a chart comparing the same number of days worked so bonuses can go to the best employee… by day, week, month… and in another chart the total net profit, also by day, month"
- Open questions weren't answered; built with these defaults (easy to change):
  - Per-seller value: Neto − Pago
  - A seller with no record in the period is left out; no minimum N (one seller with 1 day makes N = 1)
  - The comparison covers the chosen day / week / month / since the beginning (Day → N = 1)
  - Second chart: total Neto (before pay), per day / week / month; per month for "Since the beginning"
- Built: `buildEqualDaysComparison`, `buildNetProfitByPeriod` (`src/lib/money/seller-comparison.ts` + tests); `FinanceSection`, `SellerComparisonChart` (one line per seller over Day 1 … Day N, each point that day's Neto − Pago, own color per seller fixed by name; ranked list with each total above it), `NetProfitChart` (area line per period, scrolls sideways) — first built as bar charts; at the user's request the line versions were added and the bar versions kept above them (`SellerComparisonBarChart`: horizontal bars, own color per seller; a `NetProfitBarChart` with vertical bars was added too, then removed at the user's request); the comparison hint and empty state are shown once by `FinanceSection`; page loads cost inputs with `getNetProfitInputs`
- Existing reused: row Neto in `src/lib/money/revenue.ts`, pay in `seller-pay.ts`
- Admin-only data (costs, Neto); page already gated by `requirePageAccess("FINANCE")`
- UI polish (user asked for a more professional look): toolbar card with a segmented Day / Week / Month / Since the beginning control and the period picker; the two total boxes are cards with an icon, the period chip, a large amount and a "Per worker" list (rank, color avatar with initials in the seller's chart color, days, amount, share bar); a "Fair comparison for bonuses" callout with N; every chart in a shared `FinanceCard` with a subtitle; the two seller charts side by side on wide screens; "1 día" singular (`daysText`)
- The Day / Week / Month toolbar is sticky (user request): under the 5rem desktop header on lg+, and on phones under the panel's top bar, whose height `PanelShell` keeps in `--phone-bar-height` (`useHeightCssVar`, ResizeObserver) — `--sticky-offset` now uses it below lg too, so the Sale Records table headers also stop sliding under the phone bar
- Line chart, final form (user: "it must show the same as the bar chart, just another chart type"): the same equal-days figures as lines — each seller's running Neto − Pago from 0 ("Start") through Day 1 … Day N, ending at their bar total, so it's a line even when N = 1; tooltip shows the running total and that day's date and amount (`EqualDaysSeller.byDay`). A real-dates version (every day worked, last 14 days on Day) was tried and replaced
- The line chart card shows the comparison is even: "N días por vendedor" badge, each chip "N de M días" (a "Cómo se calcula" table under it was added and then removed at the user's request)
- Chart style polish (`src/components/finance/chart-style.ts`: `financeTooltip`, `amountAxis`, `categoryAxis`, `areaGradient`): rounded light/dark tooltips with point-style dots, dashed light grid, fewer Bs ticks, no axis lines; bars rounded (8px) with hover outline; seller lines smooth (monotone), white-rimmed points, the last (total) point larger, tooltip sorted by amount; the total Neto area fades from green to transparent
- Both "Cuánto hizo ganar…" charts now say the same calculated days for every seller (user: if the fewest days worked is 2, it's 2 days for everyone): "N días por vendedor" chip on both cards (`DaysPerSellerBadge`), the bar tooltip and the line chips read "Calculado con N días" (`calculatedDaysText`); each seller's own days worked is no longer shown there (`finance.daysWorked`, `finance.daysCountedOf` removed)
- Leveled the two side-by-side seller charts (user: one card had white space): the line chart's chips were removed (same order, totals and colors as the bars; its tooltip footer says "Calculado con N días"), both charts share one height (`comparisonChartHeightClass`: h-72 up to 6 sellers, then grows like the bars), sit at the bottom of their cards (`mt-auto`), and the line card's title/subtitle were shortened to "Acumulado día a día (neto − pago)" / "De 0 al total de cada vendedor"
- The sticky toolbar slides away (up, faded, not clickable) while scrolling down the page and comes back on scrolling up or near the top (`useHideOnScrollDown`: 8px jitter threshold, always shown in the first 120px); the user chose the usual direction when asked
