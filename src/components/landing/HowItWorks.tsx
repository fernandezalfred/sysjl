import type { TranslateFn } from "@/lib/i18n/translations";
import { SectionHeading } from "@/components/landing/SectionHeading";

// How a company starts using the system, in three steps.
export function HowItWorks({ t }: { t: TranslateFn }) {
  const steps = [1, 2, 3].map((n) => ({ n, title: t(`landing.step${n}Title`), text: t(`landing.step${n}Text`) }));

  return (
    <section id="how" aria-labelledby="how-heading" className="scroll-mt-20">
      <SectionHeading id="how-heading" eyebrow={t("landing.how.eyebrow")} title={t("landing.how.title")} />
      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.n} className="flex gap-4 sm:flex-col">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
              {step.n}
            </span>
            <div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-foreground/65">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
