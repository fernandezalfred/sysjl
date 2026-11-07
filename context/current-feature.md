# Current Feature: Trend Chart Horizontal Scroll

## Status

In Progress

## Goals

- The "Total vendidos más no vendidos en el tiempo, por usuario (Bs)" chart (`UserTrendChart`, on `/` and `/dashboard`) is easier to read: on every screen it gets at least ~4rem per period (min-width tiers from 32rem to 128rem, literal Tailwind classes) inside an `overflow-x-auto` frame that scrolls sideways when the chart is wider than its container (follow-up: "in all screen add scroll"; first done for phones only).
- It starts scrolled to the newest period, and again when switching Día / Semana / Mes.
- Styled scrollbar (follow-up: "give style to scrool"): new `.styled-scroll` class in `globals.css` — thin, rounded, black thumb (follow-up: "the style of scrool should be black"; first blue) on a neutral-200 track, neutral-500 in dark mode so the black thumb stays visible on the dark page, dark gray on hover; `scrollbar-color` for Firefox, `::-webkit-scrollbar` for Chrome / Edge / Safari.
- Slightly taller on phones (`h-72`, `h-64` from `md`).
- The legend is HTML above the scroll frame (colored dot + user name) so it stays visible while scrolling; Chart.js's own legend is off.

## Notes

- From a direct request: "in the section of char 'Total vendidos más no vendidos en el tiempo, por usuario (Bs)' in phone improve visivility add scroll orisontal".
- Side effect: the HTML legend can't be clicked to hide a user's line (Chart.js's legend could).
- Only this chart changed; the other charts are untouched.
