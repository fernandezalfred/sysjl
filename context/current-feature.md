# Current Feature: Ingresos y egresos Context Labels

## Status

In Progress

## Goals

- Every text on `/admin/finance` says what it refers to in the chosen view: "en este día" / "en esta semana" / "en este mes" / "desde el inicio" (`finance.scope.*`) in the box hints, "Por trabajador, …", the bonus callout, the empty state and the seller chart subtitles
- The company chart title and subtitle follow the grouping: "Neto total de la empresa por día / semana / mes", "… de cada día / semana / mes" (`finance.per.*`, `finance.unit.*`)
- Axis titles on every chart: "Neto − pago (Bs)" (bars), "Días comparados" / "Neto − pago acumulado (Bs)" (lines), "Día / Semana / Mes" / "Neto (Bs)" (company Neto) — `amountAxis(mode, title)`, `categoryAxis(title)`

## Notes

- Request (Spanish): "actualiza con palabras que identifican cada cosa en cada situación" — read as context-aware wording per view plus axis titles
