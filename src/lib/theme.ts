// Light / dark mode. With no choice saved the app follows the OS (prefers-color-scheme);
// once the user picks one with ThemeToggle, it's kept in localStorage and set as
// data-theme on <html>, which globals.css and the Tailwind `dark:` variant follow.
// Browser-only helpers (they touch document / window), except THEME_INIT_SCRIPT.

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "themechange";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// The page background of each mode, for the browser bar / installed app title bar.
const THEME_COLORS: Record<Theme, string> = { light: "#ffffff", dark: "#0a0a0a" };

// Inlined in <head> so the saved mode applies before the first paint (no flash of the
// other mode). Plain ES5, as it runs before any bundle.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark")return;document.documentElement.dataset.theme=t;var c=t==="dark"?"${THEME_COLORS.dark}":"${THEME_COLORS.light}";document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})})}catch(e){}})();`;

// The mode on screen right now: the user's choice, or the OS one.
export function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the choice lasts until the page reloads.
  }
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Calls onChange when the mode changes: the user's toggle or the OS setting.
export function subscribeTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
