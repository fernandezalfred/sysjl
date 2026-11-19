# Current Feature: Whole Panel on Phones

## Status

In Progress

## Goals

- Panel shell: below lg only the compact row (menu, greeting/breadcrumbs, avatar) stays pinned and sets `--phone-bar-height`; the seller pay cards and the admin "Por pagar" button scroll with the page; no empty space above the bar (panel `pt-0`, `lg:pt-8`); drawer links 44px tall below lg
- 16px company switcher select below lg (no iOS zoom)
- 40px tap targets on phones: Nuevo registro, Nueva compra, Repetir último día, Abrir (companies); larger Pagar / Pagado pill, Día / Semana / Mes buttons and trend legend chips; a bit of padding on "Editar empresa" and Desactivar / Reactivar
- Clicking a Sale Records day header scrolls the charts in below the pinned bar (`scroll-mt` from `--sticky-offset`)
- Granos modal sized like the Sale Record modal on phones (inset, 90dvh, rounded-2xl, p-4 / sm:p-6), scrollbar unchanged

## Notes

- Request: "improve for mobile devices the whole panel"; surveyed Panel (charts, Sale Records with its card view), Ingresos y egresos (done before), users, grains, companies, account and the shell — forms already used 16px inputs and phone card views
