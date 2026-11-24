# Current Feature

Light / dark mode toggle

## Status

In Progress

## Goals

- A sun/moon icon button switches between light and dark mode (sidebar footer under Idioma, landing nav, login)
- With no choice saved the app follows the OS; the choice is remembered (localStorage) and applied before the first paint (no flash)
- Everything follows it: Tailwind `dark:` classes, `globals.css` dark rules, charts, SweetAlert popups, the browser bar color

## Notes

- `src/lib/theme.ts` (`THEME_INIT_SCRIPT`, `currentTheme`, `setTheme`, `subscribeTheme`), `src/components/ui/ThemeToggle.tsx`
- `@custom-variant dark` in `globals.css`: `[data-theme=dark]`, or the OS dark setting unless `[data-theme=light]`
- localStorage instead of a cookie: reading a cookie in the root layout would make every page dynamic
