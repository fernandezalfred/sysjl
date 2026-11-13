# Current Feature

Admin pay status, charts page, income & expenses page

## Status

In Progress

## Goals

- In Sale Records, the admin's "Pago" line under each seller shows a status pill (green "✓ Pagado" / amber "Por cobrar") with the amount in blue (like the "Pagar" button) while unpaid and green, struck through, once paid (like the "✓ Pagado" button), instead of a struck-through amount with "(Pagado)". The subtraction Ganancia neta − Pago is unchanged.
- The pill itself is the button for admins (moved out of the Leche y Mote column): the pill reads "Pagar" (blue) while unpaid and clicking it marks the day paid, clicking "✓ Pagado" undoes it, after a confirmation (`PayPaidToggle`, passed to `UserCell` as `payToggle`).
- Admin header (panel, phone and desktop): a "Por pagar" button always showing the total still owed to all sellers and how many are owed; it opens a dropdown listing every seller with what they're owed and the days (most owed first; "Al día" with ✓ when nothing is pending). Closes on outside click or Escape. `pendingPayBySeller` in `seller-pay.ts`, loaded in `src/app/(panel)/layout.tsx`; `AdminPendingPay`.
- The Sales by User charts move from `/dashboard` to a new `/charts` page ("Gráficos", Overview group; sellers see only their own data). The Sale Records day headers are now links to `/charts?day=YYYY-MM-DD` (`DayHeaderLink`, replaces `DayHeaderButton`).
- New admin page `/admin/finance` ("Ingresos y egresos"), from every seller's sale records: Día / Semana / Mes and a period picker (latest by default). For the chosen period: tiles (Ingresos, Costos, Ganancia neta, Pagos, Resultado = Ganancia neta − Pagos), income by product (Queso and Yogurt with units taken, sold and left over, Leche y Mote, and the total sold of every product) and costs and pay (Queso/Yogurt purchase cost, Milk with liters, grains, pay), each with its share of income; a per-seller table (days, sales, Ganancia neta, pay, result). Over every period: Ingresos vs Egresos (costs + pay) and Resultado charts and a table with totals. `src/lib/money/finance.ts` (`buildFinanceByPeriod`, `totalFinance`, `buildSellerFinance`).
- Reports: CSV (UTF-8 with BOM, three sections), Excel .xlsx with three sheets (Resumen, Por periodo, Por vendedor; `write-excel-file`, loaded on click) and Imprimir / PDF (browser print dialog; sidebar, header and controls hidden on paper, print-only title and date). `src/lib/reports.ts` (`buildFinanceReport`, `toCsv`).
