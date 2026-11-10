import type { TranslateFn } from "@/lib/i18n/translations";
import { SectionHeading } from "@/components/landing/SectionHeading";

const FEATURES = [
  { key: "dailySales", icon: "M4 19V5M4 19h16M8 15l3-4 3 2 4-6" },
  { key: "ranking", icon: "M8 4h8v5a4 4 0 0 1-8 0zM16 6h3a3 3 0 0 1-3 3M8 6H5a3 3 0 0 0 3 3M12 13v4M9 20h6" },
  { key: "pay", icon: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10v4M18 10v4" },
  { key: "netProfit", icon: "M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3" },
  { key: "branches", icon: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" },
  { key: "mobile", icon: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2" },
] as const;

// What the system does, one card per feature.
export function FeatureGrid({ t }: { t: TranslateFn }) {
  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-20">
      <SectionHeading
        id="features-heading"
        eyebrow={t("landing.features.eyebrow")}
        title={t("landing.features.title")}
        subtitle={t("landing.features.subtitle")}
      />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li
            key={feature.key}
            className="group rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 transition hover:border-sky-500/40 hover:bg-sky-500/[0.04]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600/10 text-sky-700 dark:text-sky-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
                <path d={feature.icon} />
              </svg>
            </span>
            <h3 className="mt-4 font-semibold">{t(`landing.feature.${feature.key}.title`)}</h3>
            <p className="mt-1.5 text-sm text-foreground/65">{t(`landing.feature.${feature.key}.text`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
