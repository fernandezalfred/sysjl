import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { getT } from "@/lib/i18n/server";
import type { TranslateFn } from "@/lib/i18n/translations";
import { LandingNav } from "@/components/landing/LandingNav";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { RolesSection } from "@/components/landing/RolesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

// The public landing page: presents the system to the distribution companies that would
// rent it. It shows no real company's data (the preview uses made-up figures).
export default function Home() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <LandingContent />
    </Suspense>
  );
}

async function LandingContent() {
  const [session, { t, locale }] = await Promise.all([auth(), getT()]);
  const isSignedIn = Boolean(session?.user?.id);
  const primaryHref = isSignedIn ? "/dashboard" : "/login";
  const primaryLabel = isSignedIn ? t("landing.goToPanel") : t("header.signIn");

  return (
    <>
      <LandingNav isSignedIn={isSignedIn} locale={locale} t={t} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-foreground/10">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/70 px-3 py-1 text-xs font-medium text-foreground/70">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                {t("landing.hero.eyebrow")}
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t("landing.hero.title")}</h1>
              <p className="mt-5 max-w-xl text-base text-foreground/70 sm:text-lg">{t("landing.hero.text")}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="rounded-lg bg-foreground px-5 py-3 text-center text-sm font-semibold text-background shadow-sm transition hover:opacity-90"
                >
                  {primaryLabel}
                </Link>
                <a
                  href="#features"
                  className="rounded-lg border border-foreground/20 px-5 py-3 text-center text-sm font-semibold transition hover:bg-foreground/5"
                >
                  {t("landing.hero.secondary")}
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/65">
                {["landing.hero.point1", "landing.hero.point2", "landing.hero.point3"].map((key) => (
                  <li key={key} className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
            <ProductPreview t={t} />
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <FeatureGrid t={t} />
          <RolesSection t={t} />
          <HowItWorks t={t} />
          <FinalCallToAction href={primaryHref} label={primaryLabel} t={t} />
          <Footer t={t} />
        </div>
      </main>
    </>
  );
}

function FinalCallToAction({ href, label, t }: { href: string; label: string; t: TranslateFn }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-700 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{t("landing.cta.title")}</h2>
          <p className="mt-2 text-white/80">{t("landing.cta.text")}</p>
        </div>
        <Link href={href} className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-sky-800 shadow-sm transition hover:bg-white/90">
          {label}
        </Link>
      </div>
    </section>
  );
}

function LandingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-11 w-40" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
