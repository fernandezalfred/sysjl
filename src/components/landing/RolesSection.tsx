import type { TranslateFn } from "@/lib/i18n/translations";
import { SectionHeading } from "@/components/landing/SectionHeading";

const ROLES = [
  { key: "admin", tone: "from-indigo-500 to-violet-600" },
  { key: "subadmin", tone: "from-sky-500 to-indigo-600" },
  { key: "seller", tone: "from-emerald-500 to-teal-600" },
] as const;

// The three access levels: the platform admin, each company's sub-admin, and sellers.
export function RolesSection({ t }: { t: TranslateFn }) {
  return (
    <section id="roles" aria-labelledby="roles-heading" className="scroll-mt-20">
      <SectionHeading
        id="roles-heading"
        eyebrow={t("landing.roles.eyebrow")}
        title={t("landing.roles.title")}
        subtitle={t("landing.roles.subtitle")}
      />
      <ol className="mt-8 grid gap-4 lg:grid-cols-3">
        {ROLES.map((role, index) => (
          <li key={role.key} className="relative overflow-hidden rounded-2xl border border-foreground/10 p-5">
            <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${role.tone}`} />
            <p className="text-xs font-semibold text-foreground/50">0{index + 1}</p>
            <h3 className="mt-1 text-lg font-semibold">{t(`landing.role.${role.key}.title`)}</h3>
            <p className="mt-1 text-sm text-foreground/65">{t(`landing.role.${role.key}.text`)}</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                  <span>{t(`landing.role.${role.key}.item${n}`)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
