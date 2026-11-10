# Current Feature

Milk in the sale record (remove the Milk page)

## Status

In Progress

## Goals

- Creating or editing a sale record asks for Milk liters and the price per liter it was bought at. Both are required (0 allowed), for sellers and admins.
- Ganancia neta takes off the record's own liters × price per liter, instead of the Milk purchases.
- Existing sale records get the liters and price per liter of the old Milk purchases (same seller, same Bolivia day; several purchases are added up, the price is the average). Records without one get 0.
- The old Milk purchases are deleted from the database after being copied (a JSON backup is kept outside the repo).
- `/admin/milk` is removed, with its sidebar link, components, "Repeat last day" for Milk, actions and translations. Grains are unchanged.
- The Milk cost is cost data: guests on `/` don't receive it in the page data.

## Notes

- New `DailyWorkRecord.milkLiters Int @default(0)` and `milkUnitCost Float @default(0)`; `MILK` and `StockPurchase.forUser` leave the schema once the old purchases are gone.
