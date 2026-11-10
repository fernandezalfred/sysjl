import type { TranslateFn } from "@/lib/i18n/translations";

// A drawn preview of the panel with made-up figures (labeled "Ejemplo"), so a company
// sees what it gets without showing any real customer's data.
const EXAMPLE_SELLERS = [
  { name: "Carla", amount: "Bs 3.240", width: "w-full", winner: true },
  { name: "Jorge", amount: "Bs 2.910", width: "w-[90%]", winner: false },
  { name: "Lucía", amount: "Bs 2.480", width: "w-[76%]", winner: false },
];

export function ProductPreview({ t }: { t: TranslateFn }) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-sky-500/20 via-indigo-500/10 to-transparent blur-2xl" />
      <figure className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl shadow-sky-900/10">
        <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.03] px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/60">
            {t("landing.preview.example")}
          </span>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-foreground/60">{t("landing.preview.branch")}</p>
              <p className="font-semibold">{t("landing.preview.today")}</p>
            </div>
            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              +12%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <PreviewStat label={t("landing.preview.sales")} value="Bs 8.630" />
            <PreviewStat label={t("landing.preview.netProfit")} value="Bs 3.115" accent />
            <PreviewStat label={t("landing.preview.pay")} value="Bs 560" />
          </div>

          <ul className="flex flex-col gap-2.5">
            {EXAMPLE_SELLERS.map((seller) => (
              <li key={seller.name} className="rounded-xl border border-foreground/10 p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {seller.name}
                    {seller.winner ? (
                      <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400">
                        {t("landing.preview.winner")}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-semibold tabular-nums">{seller.amount}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div className={`h-full rounded-full ${seller.winner ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-sky-500/70"} ${seller.width}`} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <figcaption className="sr-only">{t("landing.preview.caption")}</figcaption>
      </figure>
    </div>
  );
}

function PreviewStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-foreground/[0.04] p-2.5">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-foreground/55">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${accent ? "text-purple-700 dark:text-purple-400" : ""}`}>{value}</p>
    </div>
  );
}
