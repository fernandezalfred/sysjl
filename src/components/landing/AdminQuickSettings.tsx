import Link from "next/link";
import type { TranslateFn } from "@/lib/i18n/translations";

interface AdminQuickSettingsProps {
  t: TranslateFn;
}

export function AdminQuickSettings({ t }: AdminQuickSettingsProps) {
  const links = [
    {
      href: "/admin/users",
      label: t("adminSettings.manageUsers.label"),
      description: t("adminSettings.manageUsers.desc"),
    },
    {
      href: "/dashboard",
      label: t("adminSettings.dashboard.label"),
      description: t("adminSettings.dashboard.desc"),
    },
  ];

  return (
    <section aria-labelledby="admin-settings-heading" className="flex flex-col gap-3">
      <h2
        id="admin-settings-heading"
        className="text-sm font-medium uppercase tracking-wide text-foreground/70"
      >
        {t("adminSettings.title")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-lg border border-foreground/10 p-4 transition hover:border-foreground/30 hover:bg-foreground/[0.03]"
          >
            <p className="font-medium group-hover:underline">{link.label}</p>
            <p className="mt-1 text-xs text-foreground/70">{link.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
