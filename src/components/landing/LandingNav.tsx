import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { BrandMark } from "@/components/landing/BrandMark";
import type { Locale, TranslateFn } from "@/lib/i18n/translations";

interface LandingNavProps {
  isSignedIn: boolean;
  locale: Locale;
  t: TranslateFn;
}

// The landing page's top bar: brand, section links (wider screens), language and one
// call to action (sign in, or go to the dashboard when already signed in).
export function LandingNav({ isSignedIn, locale, t }: LandingNavProps) {
  const links = [
    { href: "#features", label: t("landing.nav.features") },
    { href: "#roles", label: t("landing.nav.roles") },
    { href: "#how", label: t("landing.nav.how") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-base font-semibold tracking-tight">SysJL</span>
        </Link>
        <nav aria-label={t("landing.nav.label")} className="hidden items-center gap-6 text-sm text-foreground/70 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageSwitcher locale={locale} />
          <Link
            href={isSignedIn ? "/dashboard" : "/login"}
            className="rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background shadow-sm transition hover:opacity-90"
          >
            {isSignedIn ? t("landing.goToPanel") : t("header.signIn")}
          </Link>
        </div>
      </div>
    </header>
  );
}
