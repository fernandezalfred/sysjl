# Current Feature

Prettier Prices & Costs form

## Status

In Progress

## Goals

- The Queso / Yogurt sale price and purchase cost cards at the bottom of `/dashboard` look like the rest of the app
- Card with a product badge and who set it last; the two amounts side by side with "Bs" inside the field (sale record form style, `FIELD_STATE_CLASS`); a clear Guardar button (full width on phones)

## Notes

- `src/components/admin/product-pricing/SetProductPriceForm.tsx` (`PriceField`); translation keys `adminProducts.salePrice` / `purchaseCost` replace the "(Bs)" ones, `currentInfo` removed (the fields already show the current values)
