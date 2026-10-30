import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return (LOCALES as string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

export async function getT(): Promise<{ locale: Locale; t: TranslateFn }> {
  const locale = await getServerLocale();
  return { locale, t: (key, vars) => translate(locale, key, vars) };
}
