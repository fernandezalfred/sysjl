import { formatShortDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { UserTotal } from "@/types/landing";

interface TopSellerBannerProps {
  userTotals: UserTotal[];
  t: TranslateFn;
}

// userTotals arrives sorted by date descending (see UserTotalsSection), so the
// first entry's date is the most recent day with any records.
export function TopSellerBanner({ userTotals, t }: TopSellerBannerProps) {
  const latestDate = userTotals[0]?.date;
  if (!latestDate) return null;

  const winners = userTotals.filter((u) => u.date === latestDate && u.isDailyWinner);
  if (winners.length === 0) return null;

  const isPlural = winners.length > 1;
  const names = winners.map((w) => w.userName).join(" & ");
  const margin = winners[0]?.winnerMargin ?? null;
  const marginPart = margin !== null ? t("topSeller.byMargin", { margin: formatCurrency(margin) }) : "";

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
        {t("topSeller.badge")} · {formatShortDate(latestDate)}
      </p>
      <p className="mt-1 text-lg font-semibold">
        {t(isPlural ? "topSeller.leadingPlural" : "topSeller.leadingSingular", { names, marginPart })}
      </p>
      <p className="mt-1 text-sm text-foreground/70">
        {t(isPlural ? "topSeller.pitchPlural" : "topSeller.pitchSingular", { names })}
      </p>
    </section>
  );
}
