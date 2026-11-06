import { setLocale } from "@/actions/locale";
import type { Locale } from "@/lib/i18n/translations";

interface LanguageSwitcherProps {
  locale: Locale;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  return (
    <form action={setLocale} className="flex items-center gap-1 text-xs text-foreground/60">
      <button
        type="submit"
        name="locale"
        value="en"
        disabled={locale === "en"}
        className={`p-2 ${locale === "en" ? "font-semibold text-foreground" : "underline hover:text-foreground"}`}
      >
        EN
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="submit"
        name="locale"
        value="es"
        disabled={locale === "es"}
        className={`p-2 ${locale === "es" ? "font-semibold text-foreground" : "underline hover:text-foreground"}`}
      >
        ES
      </button>
    </form>
  );
}
