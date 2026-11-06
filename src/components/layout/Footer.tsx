import type { TranslateFn } from "@/lib/i18n/translations";

interface FooterProps {
  t: TranslateFn;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer className="mt-4 border-t border-foreground/10 pt-6 text-center text-xs text-foreground/60">
      <p>{t("footer.tagline")}</p>
      <p className="mt-1">{t("footer.rights", { year: new Date().getFullYear() })}</p>
    </footer>
  );
}
