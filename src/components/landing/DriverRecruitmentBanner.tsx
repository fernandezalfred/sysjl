import Link from "next/link";
import type { TranslateFn } from "@/lib/i18n/translations";

interface DriverRecruitmentBannerProps {
  t: TranslateFn;
}

export function DriverRecruitmentBanner({ t }: DriverRecruitmentBannerProps) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        {t("driverBanner.label")}
      </p>
      <p className="mt-1 text-lg font-semibold">{t("driverBanner.title")}</p>
      <p className="mt-1 text-sm text-foreground/70">{t("driverBanner.body")}</p>
      <Link
        href="/login"
        className="mt-3 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        {t("driverBanner.cta")}
      </Link>
    </section>
  );
}
