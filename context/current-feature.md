# Current Feature

New record starts with the seller's last values

## Status

In Progress

## Goals

- A new sale record prefills Queso Sacó, Yogurt Sacó, Leche litros and Bs por litro from that seller's last created record
- Everything else (Sobró, Total venta) stays blank
- An admin's form refills those four when they pick the seller; a seller with no records yet keeps Yogurt 24, Leche 30, Bs 7

## Notes

- `newRecordDefaultsByUser` in `src/lib/editable-record.ts` (Prisma-free, tested); `CreateRecordForm` (controlled user select), `RecordFormFields` (`previous`, the four fields keyed by seller)
