# Current Feature: Singular "1 día" in Boxes + Companies Net Profit

## Status

In Progress

## Goals

- "1 día" instead of "1 días" in the seller pay cards (`SellerPayBar`: Cobrado / Te falta cobrar / Ganancia total) and the admin "Por pagar" dropdown (`AdminPendingPay`) — new `pay.dayOne`
- Ingresos y egresos: the bonus note reads "Se compara el último día trabajado…" when N = 1 (`finance.comparisonHintOne`), and the workers' box says "1 registro" (`finance.recordOne` / `finance.recordsCount`); the per-worker lists already used `daysText`
- Companies page (`/admin/companies`): "Ventas (30 días)" → "Ganancia neta (30 días)" = Neto − Pago of the last 30 days' records, with each company's own costs and grains (`netAfterPaySince` in `seller-comparison.ts`, loaded per company in `company-summaries.ts`); `CompanySummary.recentSales` → `recentNetProfit`

## Notes

- Request (Spanish): "muestra 1 día en vez de 1 días en las cajas"
- Second request (Spanish): "en la página de empresas debes poner ganancias neta en vez de ventas"; done on the same branch
