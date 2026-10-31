import type { TranslateFn } from "@/lib/i18n/translations";

export interface QuickStatsData {
  activeDrivers: number;
  totalRecords: number;
}

interface QuickStatsProps {
  stats: QuickStatsData;
  t: TranslateFn;
}

export function QuickStats({ stats, t }: QuickStatsProps) {
  const tiles = [
    { label: t("adminPanel.activeDrivers"), value: String(stats.activeDrivers) },
    { label: t("adminPanel.totalRecords"), value: String(stats.totalRecords) },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        {t("adminPanel.quickStats")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{tile.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
