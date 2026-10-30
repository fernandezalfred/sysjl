import { formatShortDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/pricing";
import type { UserTotal } from "@/types/landing";

interface UserTotalsSectionProps {
  userTotals: UserTotal[];
}

// Matches Sale Records' "sold" revenue: Queso + Yogurt + Milk & Mote, excluding
// the value of unsold ("left") product.
function soldRevenueOf(u: UserTotal): number {
  return u.quesoRevenue + u.yogurtRevenue + u.milkMoteRevenue;
}

// Mirrors Sale Records' TotalRevenueCell: bold sold revenue, plus the remaining
// ("left") value and the full total (sold + left) as secondary text.
function TotalRevenueCell({ u }: { u: UserTotal }) {
  const soldRevenue = soldRevenueOf(u);
  const remainingValue = u.totalRevenue - soldRevenue;

  return (
    <>
      <div className="font-medium">
        {formatCurrency(soldRevenue)} sold
        {u.isDailyWinner && (
          <span className="ml-2 text-xs font-medium text-green-700 dark:text-green-400">
            Winner{u.winnerMargin !== null && ` (+${formatCurrency(u.winnerMargin)})`}
          </span>
        )}
      </div>
      <div className="text-xs text-foreground/60">
        {formatCurrency(remainingValue)} left, value {formatCurrency(u.totalRevenue)}
      </div>
    </>
  );
}

export function UserTotalsSection({ userTotals }: UserTotalsSectionProps) {
  return (
    <section aria-labelledby="user-totals-heading" className="flex flex-col gap-3">
      <h2 id="user-totals-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
        Totals by User
      </h2>

      <div className="hidden overflow-hidden rounded-lg border border-foreground/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-foreground/[0.03] text-left text-foreground/60">
            <tr>
              <th className="px-4 py-2 font-medium">Day</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Queso</th>
              <th className="px-4 py-2 font-medium">Yogurt</th>
              <th className="px-4 py-2 font-medium">Milk & Mote</th>
              <th className="px-4 py-2 font-medium">Total revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {userTotals.map((u) => (
              <tr
                key={`${u.date}-${u.userId}`}
                className={u.isDailyWinner ? "bg-green-50 dark:bg-green-950/40" : undefined}
              >
                <td className="px-4 py-2">{formatShortDate(u.date)}</td>
                <td className="px-4 py-2 font-medium">{u.userName}</td>
                <td className="px-4 py-2">{formatCurrency(u.quesoRevenue)}</td>
                <td className="px-4 py-2">{formatCurrency(u.yogurtRevenue)}</td>
                <td className="px-4 py-2">{formatCurrency(u.milkMoteRevenue)}</td>
                <td className="px-4 py-2">
                  <TotalRevenueCell u={u} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {userTotals.map((u) => (
          <li
            key={`${u.date}-${u.userId}`}
            className={
              u.isDailyWinner
                ? "rounded-lg border border-foreground/10 bg-green-50 p-3 dark:bg-green-950/40"
                : "rounded-lg border border-foreground/10 p-3"
            }
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{u.userName}</span>
              <span className="text-xs text-foreground/60">{formatShortDate(u.date)}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-foreground/60">Queso</p>
                <div className="font-medium">{formatCurrency(u.quesoRevenue)}</div>
              </div>
              <div>
                <p className="text-xs text-foreground/60">Yogurt</p>
                <div className="font-medium">{formatCurrency(u.yogurtRevenue)}</div>
              </div>
              <div>
                <p className="text-xs text-foreground/60">Milk & Mote</p>
                <div className="font-medium">{formatCurrency(u.milkMoteRevenue)}</div>
              </div>
            </div>
            <div className="mt-2 border-t border-foreground/10 pt-2 text-sm">
              <p className="text-xs text-foreground/60">Total Revenue</p>
              <TotalRevenueCell u={u} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
