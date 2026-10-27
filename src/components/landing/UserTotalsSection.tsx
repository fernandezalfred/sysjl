import { formatCurrency } from "@/lib/pricing";
import type { UserTotal } from "@/types/landing";

interface UserTotalsSectionProps {
  userTotals: UserTotal[];
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
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Queso</th>
              <th className="px-4 py-2 font-medium">Yogurt</th>
              <th className="px-4 py-2 font-medium">Total sold</th>
              <th className="px-4 py-2 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {userTotals.map((u) => (
              <tr key={u.userId}>
                <td className="px-4 py-2 font-medium">{u.userName}</td>
                <td className="px-4 py-2">{u.quantitySoldByProduct.QUESO}</td>
                <td className="px-4 py-2">{u.quantitySoldByProduct.YOGURT}</td>
                <td className="px-4 py-2">{u.totalQuantitySold}</td>
                <td className="px-4 py-2">{formatCurrency(u.totalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {userTotals.map((u) => (
          <li key={u.userId} className="rounded-lg border border-foreground/10 p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{u.userName}</span>
              <span className="text-sm text-foreground/70">{formatCurrency(u.totalRevenue)}</span>
            </div>
            <div className="mt-1 flex gap-4 text-sm text-foreground/70">
              <span>Queso: {u.quantitySoldByProduct.QUESO}</span>
              <span>Yogurt: {u.quantitySoldByProduct.YOGURT}</span>
              <span>Total: {u.totalQuantitySold}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
