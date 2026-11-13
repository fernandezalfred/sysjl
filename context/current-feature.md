# Current Feature: Finance Totals Since the Beginning

## Status

In Progress

## Goals

- `/admin/finance` ("Ingresos y egresos") gets a "Desde el inicio" view next to Día / Semana / Mes: one period covering every sale record and every grain purchase, from the first sale to today.
- **Total investment (Inversión total)**: what was spent per product since the beginning — Queso, Yogurt, Leche (liters × price per liter) and each grain (Maíz pelado, Maíz con cáscara, Haba) — and the total of all products.
- **Accumulated income**: total sold per product (Queso, Yogurt, Leche y Mote) and overall since the beginning.
- **Net profit since the beginning (ganancia neta acumulada)**: income − investment (product costs) − seller pay (employees' pay), i.e. what the business keeps after capital and expenses. Also show the Neto (before pay) and the total pay, so the subtraction is visible.
- **Running totals over time**: a chart (and table rows) where investment, income and net profit keep adding up day by day / month by month from the first sale, so the growth is visible.
- Reports (CSV, Excel, Imprimir / PDF) include the since-the-beginning summary with the per-product investment and the net profit.
- Logic in `src/lib/money/finance.ts` (pure, unit tested); grain cost per grain type loaded alongside `getGrainsCostByDay`.

## Notes

- Requested in Spanish: "en la página de ingresos y egresos toma todos los datos desde la primera venta, también de granos, para calcular mi inversión total desde el principio; así debe ir sumando para sacar reporte de mi total gasto por productos y total de todos los productos; lo mismo para mi ganancia neta (que es fuera del capital y gastos que hay, como pagar al empleado, etc.)".
- Decided at start (user's choice): the after-pay total is labeled "Ganancia neta acumulada" (Neto stays before pay); the Queso/Yogurt purchase cost is snapshotted on each new record (`quesoPurchaseCost`, `yogurtPurchaseCost`, optional; older records keep using the current cost via `recordUnitCost`). The snapshot is admin-only data: `withoutPurchaseCosts` strips it for sellers on `/dashboard`.
- Implementation: "Desde el inicio" sums every month (`totalFinance`), lists running totals per month (`cumulativeFinance`, table + report) and draws them per day (`CumulativeFinanceChart`). Grain costs per grain come from `getGrainsCostByDayAndProduct`; `getGrainsCostByDay` now derives from it. The costs card is "Costos por producto" with each grain and a total row (pay stays in the tiles). Removed the now-unused `getCurrentSalePrices`.
- `npx prisma db push` not run (MongoDB: the new optional fields need no index change; run it when convenient).
- "Gastos como pagar al empleado, etc.": only seller pay is recorded today. Other expenses (fuel, rent…) don't exist in the data model; adding them would be a separate feature.
