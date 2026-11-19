# Current Feature: Ingresos y egresos on Phones

## Status

In Progress

## Goals

- Toolbar: tighter padding, 40px tap targets, the four view buttons on one row ("Todo" instead of "Desde el inicio" below sm, `finance.sinceStartShort`), full-width period picker
- Total boxes: the period chip on its own line under the title on phones, amount text-2xl (3xl from sm), slightly tighter per-worker rows
- Chart cards and the bonus callout: p-3 on phones (more width for the charts), smaller titles/subtitles, smaller gaps between sections
- Charts on phones (`useIsNarrowScreen`, below 640px): no axis titles, 11px ticks, fewer amount ticks — `amountAxis(mode, title, narrow)`, `categoryAxis(title, narrow)`

## Notes

- Request: "improve for mobile devices"; scope chosen by the user: Ingresos y egresos only
