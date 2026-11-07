# Current Feature: Day Net Profit after Seller Pay, Pay Visible to Every Seller, Clearer Mobile Cards, Queso/Yogurt Detail in Totals by User

## Status

In Progress

## Goals

- The Ganancia neta in each day header of Sale Records (`/dashboard`) is the sum, over the day's records, of each record's Ganancia neta minus its Pago (the "Ganancia neta − Pago" result under each seller's name), instead of the sum of Ganancia neta alone.
- Same in Totals by User (`/`), which shares the day header and the same calculation.
- User column: admins see the subtraction (Ganancia neta − Pago) as before; any other signed-in user (a seller) now sees the name and that day's Pago on every row, not only their own; guests still see only the name. Edit stays limited to admins and the record's own seller.
- Mobile cards (Sale Records below the table width, Totals by User below `md`) show clearly where each record ends: stronger border (`border-foreground/25`), a blue left bar (`border-l-4 border-l-sky-600` / dark `sky-400`, matching the user names), a faint background, a light shadow, and 12px between cards (was 8px).
- Totals by User (`/`, public) Queso and Yogurt columns show the same detail as Sale Records — "Vendió N … Bs" and "Sacó N · Sobró N … Bs" — to everyone, guests included (quantities and sale-price values only, no cost). `ProductCell` moved out of `SaleRecordsSection` into its own file and is shared; `UserTotal` carries `queso` / `yogurt` breakdowns instead of `quesoRevenue` / `yogurtRevenue`. Its mobile cards are now one column (Queso, Yogurt, then Leche y Mote on one row), since those lines never wrap.
- `buildNetProfitByDate` renamed `buildNetProfitAfterPayByDate` in `src/lib/money/revenue.ts`, unit-tested.

## Notes

- From a direct request: "en registro de venta la calculacion de ganancia neta deve ser la suma del dia pero sumalo el resultado de ganancia neta menos el pago al trabjador".
- The header label stays "Ganancia neta". Admins only, as before. Per-record figures and the charts are unchanged.
- Follow-up: "solo usuario admin deve ver la calculacion de la resta en la columna de usuario de lo contrario solo muestra nombre de usuario y su respectivo pago del dia trabajado". The subtraction was already admin-only (cost data is loaded only for admins). Asked who else sees Pago; the user chose every signed-in seller on every row (guests: name only). This reverses the earlier "seller sees only their own pay" choice.
- Follow-up: "en mobile clarifica donde termina cada fila de la tabla". No style was named; the blue left bar + stronger border was picked.
- Follow-up: "toda las descripcion de la columna queso y yogurt muestra publicamente".
