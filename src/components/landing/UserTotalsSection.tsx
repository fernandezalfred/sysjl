"use client";

import { Fragment, useRef, useState } from "react";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/pricing";
import { toEditableRecord } from "@/lib/records";
import { EditRecordForm } from "@/components/records/EditRecordForm";
import type { DailyRecordRow, UserTotal } from "@/types/landing";
import type { DailyWorkRecordRow } from "@/types/records";

interface UserTotalsSectionProps {
  userTotals: UserTotal[];
  dailyRecords: DailyRecordRow[];
  currentUserId: string | null;
  isAdmin: boolean;
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

interface DayGroup {
  date: string;
  totals: UserTotal[];
}

// userTotals arrives sorted by date descending with same-day ties keeping
// buildDailyRecords' own ordering; grouping preserves that order within each day.
function groupByDay(totals: UserTotal[]): DayGroup[] {
  const map = new Map<string, UserTotal[]>();
  for (const u of totals) {
    const group = map.get(u.date);
    if (group) {
      group.push(u);
    } else {
      map.set(u.date, [u]);
    }
  }

  return Array.from(map.entries())
    .map(([date, groupTotals]) => ({ date, totals: groupTotals }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function UserTotalsSection({
  userTotals,
  dailyRecords,
  currentUserId,
  isAdmin,
}: UserTotalsSectionProps) {
  const dayGroups = groupByDay(userTotals);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<DailyWorkRecordRow | null>(null);

  const dailyRecordsByKey = new Map(
    dailyRecords.map((row) => [`${row.date}|${row.userId}`, row]),
  );

  function openEdit(u: UserTotal) {
    const row = dailyRecordsByKey.get(`${u.date}|${u.userId}`);
    if (!row) return;
    setEditing(toEditableRecord(row));
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

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
              <th className="px-4 py-2 font-medium">Milk & Mote</th>
              <th className="px-4 py-2 font-medium">Total revenue</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {dayGroups.map((group) => (
              <Fragment key={group.date}>
                <tr className="bg-foreground/10 dark:bg-foreground/15">
                  <td
                    colSpan={6}
                    className="px-4 py-2 text-sm font-semibold uppercase tracking-wide text-foreground"
                  >
                    {formatShortDate(group.date)}
                  </td>
                </tr>
                {group.totals.map((u) => (
                  <tr key={`${u.date}-${u.userId}`}>
                    <td className="px-4 py-2 font-medium">{u.userName}</td>
                    <td className="px-4 py-2">{formatCurrency(u.quesoRevenue)}</td>
                    <td className="px-4 py-2">{formatCurrency(u.yogurtRevenue)}</td>
                    <td className="px-4 py-2">{formatCurrency(u.milkMoteRevenue)}</td>
                    <td
                      className={
                        u.isDailyWinner
                          ? "rounded-md bg-green-50 px-4 py-2 dark:bg-green-950/40"
                          : "px-4 py-2"
                      }
                    >
                      <TotalRevenueCell u={u} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isAdmin || u.userId === currentUserId ? (
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="text-sm text-foreground/60 underline hover:text-foreground"
                        >
                          Edit
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {dayGroups.map((group) => (
          <div key={group.date} className="flex flex-col gap-2">
            <p className="rounded-md bg-foreground/10 px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-foreground dark:bg-foreground/15">
              {formatShortDate(group.date)}
            </p>
            <ul className="flex flex-col gap-2">
              {group.totals.map((u) => (
                <li
                  key={`${u.date}-${u.userId}`}
                  className="rounded-lg border border-foreground/10 p-3"
                >
                  <div className="font-medium">{u.userName}</div>
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
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div
                      className={
                        u.isDailyWinner
                          ? "flex-1 rounded-md border-t border-foreground/10 bg-green-50 p-2 pt-2 text-sm dark:bg-green-950/40"
                          : "flex-1 border-t border-foreground/10 pt-2 text-sm"
                      }
                    >
                      <p className="text-xs text-foreground/60">Total Revenue</p>
                      <TotalRevenueCell u={u} />
                    </div>
                    {isAdmin || u.userId === currentUserId ? (
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="text-sm text-foreground/60 underline hover:text-foreground"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-foreground/10 bg-background p-6 text-foreground"
      >
        <h3 className="mb-4 text-sm font-medium">Edit record</h3>
        {editing ? (
          <EditRecordForm key={editing.id} record={editing} onSaved={close} onCancel={close} />
        ) : null}
      </dialog>
    </section>
  );
}
