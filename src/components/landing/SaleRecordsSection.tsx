import { formatCurrency } from "@/lib/pricing";
import { formatShortDate } from "@/lib/dates";
import type { DailyRecordRow, ProductBreakdown } from "@/types/landing";

interface SaleRecordsSectionProps {
  dailyRecords: DailyRecordRow[];
}

function ProductCell({ breakdown }: { breakdown: ProductBreakdown }) {
  return (
    <>
      <div className="font-medium">{breakdown.sold} sold</div>
      <div className="text-xs text-foreground/60">
        {breakdown.taken} taken · {breakdown.remaining} left (
        {formatCurrency(breakdown.remainingValue)})
      </div>
    </>
  );
}

function TotalRevenueCell({ row }: { row: DailyRecordRow }) {
  const soldRevenue = row.queso.revenue + row.yogurt.revenue;
  const remainingValue = row.queso.remainingValue + row.yogurt.remainingValue;

  return (
    <>
      <div className="font-medium">{formatCurrency(soldRevenue)} sold</div>
      <div className="text-xs text-foreground/60">
        {formatCurrency(remainingValue)} left, value {formatCurrency(row.totalRevenue)}
      </div>
    </>
  );
}

export function SaleRecordsSection({ dailyRecords }: SaleRecordsSectionProps) {
  return (
    <section aria-labelledby="records-heading" className="flex flex-col gap-3">
      <h2
        id="records-heading"
        className="text-sm font-medium uppercase tracking-wide text-foreground/60"
      >
        Sale Records
      </h2>

      <div className="hidden overflow-x-auto rounded-lg border border-foreground/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-foreground/[0.03] text-left text-foreground/60">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Queso</th>
              <th className="px-4 py-2 font-medium">Yogurt</th>
              <th className="px-4 py-2 font-medium">Total Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {dailyRecords.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">{formatShortDate(row.date)}</td>
                <td className="px-4 py-2 font-medium">{row.userName}</td>
                <td className="px-4 py-2">
                  <ProductCell breakdown={row.queso} />
                </td>
                <td className="px-4 py-2">
                  <ProductCell breakdown={row.yogurt} />
                </td>
                <td className="px-4 py-2">
                  <TotalRevenueCell row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {dailyRecords.map((row) => (
          <li
            key={row.id}
            className="rounded-lg border border-foreground/10 p-3"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{row.userName}</span>
              <span className="text-xs text-foreground/60">
                {formatShortDate(row.date)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-foreground/60">Queso</p>
                <ProductCell breakdown={row.queso} />
              </div>
              <div>
                <p className="text-xs text-foreground/60">Yogurt</p>
                <ProductCell breakdown={row.yogurt} />
              </div>
            </div>
            <div className="mt-2 border-t border-foreground/10 pt-2 text-sm">
              <p className="text-xs text-foreground/60">Total Revenue</p>
              <TotalRevenueCell row={row} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
