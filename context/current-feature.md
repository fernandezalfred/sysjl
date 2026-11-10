# Current Feature

Seller's daily pay stands out, paid days clearly marked

## Status

In Progress

## Goals

- In Sale Records (table and phone cards), a seller sees each day's Pago as a prominent, colored badge under their name instead of a small gray line.
- Paid days are clearly marked: green badge with a check and "Pagado"; days not paid yet: amber badge with "Por cobrar". No strikethrough for the seller.
- The seller's panel header shows three cards: Cobrado (paid Pago, green), Te falta cobrar (unpaid, amber) and Ganancia total (their sum, blue), each with its days (`paidSellerPay` in `seller-pay.ts`).
- Admins' view (Ganancia neta − Pago) is unchanged.
