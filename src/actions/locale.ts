"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n/translations";

export async function setLocale(formData: FormData): Promise<void> {
  const raw = formData.get("locale");
  if (typeof raw !== "string" || !(LOCALES as string[]).includes(raw)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, raw as Locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
