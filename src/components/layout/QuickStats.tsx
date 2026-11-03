import type { ReactNode } from "react";
import { formatCurrency, PRODUCT_LABEL_KEYS } from "@/lib/pricing";
import type { Locale, TranslateFn } from "@/lib/i18n/translations";
import type { QuickStatsData } from "@/lib/quick-stats";

interface QuickStatsProps {
  stats: QuickStatsData;
  t: TranslateFn;
  locale: Locale;
}

interface Tile {
  label: string;
  value: ReactNode;
}

function intlLocale(locale: Locale): string {
  return locale === "es" ? "es-BO" : "en-US";
}

function formatDay(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short" }).format(
    new Date(`${isoDate}T00:00:00`),
  );
}

function formatMonth(month: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`),
  );
}

export function QuickStats({ stats, t, locale }: QuickStatsProps) {
  const day = stats.lastDay ? formatDay(stats.lastDay, locale) : "—";
  const tiles: Tile[] = [
    {
      label: t("quickStats.lastDaySales", { date: day }),
      value: stats.lastDay ? formatCurrency(stats.lastDaySales) : "—",
    },
    {
      label: t("quickStats.lastDayNetProfit", { date: day }),
      value: stats.lastDay ? formatCurrency(stats.lastDayNetProfit) : "—",
    },
    {
      label: t("quickStats.monthNetProfit", { month: formatMonth(stats.month, locale) }),
      value: formatCurrency(stats.monthNetProfit),
    },
    {
      label: t("quickStats.depositStock"),
      value: (
        <span className="flex flex-col text-base">
          <span>
            {t(PRODUCT_LABEL_KEYS.QUESO)}: {t("quickStats.units", { quantity: stats.stock.QUESO })}
          </span>
          <span>
            {t(PRODUCT_LABEL_KEYS.YOGURT)}: {t("quickStats.units", { quantity: stats.stock.YOGURT })}
          </span>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        {t("adminPanel.quickStats")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              {tile.label}
            </p>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{tile.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
