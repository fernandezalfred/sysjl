"use client";

import { Fragment, useRef, useState } from "react";
import { DayHeaderButton } from "@/components/sales-charts/DayHeaderButton";
import { LabeledAmount } from "@/components/landing/LabeledAmount";
import { formatCurrency } from "@/lib/pricing";
import { toEditableRecord } from "@/lib/records";
import { EditRecordForm } from "@/components/records/EditRecordForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow, UserTotal } from "@/types/landing";
import type { DailyWorkRecordRow } from "@/types/records";
import { useBackdropClose } from "@/hooks/useBackdropClose";
import { useGroupedPagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";

interface UserTotalsSectionProps {
  userTotals: UserTotal[];
  dailyRecords: DailyRecordRow[];
  currentUserId: string | null;
  isAdmin: boolean;
  hideHeading?: boolean;
  locale: Locale;
}

// Matches Sale Records' "sold" revenue: Queso + Yogurt + Milk & Mote, excluding
// the value of unsold ("left") product.
function soldRevenueOf(u: UserTotal): number {
  return u.quesoRevenue + u.yogurtRevenue + u.milkMoteRevenue;
}

// Mirrors Sale Records' TotalRevenueCell: bold sold revenue, plus the remaining
// ("left") value and the full total (sold + left) as secondary text.
function TotalRevenueCell({ u, t }: { u: UserTotal; t: TranslateFn }) {
  const soldRevenue = soldRevenueOf(u);
  const remainingValue = u.totalRevenue - soldRevenue;

  return (
    <>
      <div>
        <LabeledAmount label={t("cell.sold")} amount={formatCurrency(soldRevenue)} />
        {u.isDailyWinner && (
          <span className="ml-2 text-xs font-medium text-green-700 dark:text-green-400">
            {u.winnerMargin !== null
              ? t("cell.winnerMargin", { margin: formatCurrency(u.winnerMargin) })
              : t("cell.winner")}
          </span>
        )}
      </div>
      <div className="text-xs text-foreground/60">
        <LabeledAmount label={t("cell.unsold")} amount={formatCurrency(remainingValue)} />
      </div>
      <div className="text-xs text-foreground/60">
        <LabeledAmount label={t("cell.soldPlusUnsold")} amount={formatCurrency(u.totalRevenue)} />
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
  hideHeading = false,
  locale,
}: UserTotalsSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const { pageItems: dayGroups, ...pager } = useGroupedPagination(groupByDay(userTotals), "totals");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropClose = useBackdropClose();
  const [editing, setEditing] = useState<DailyWorkRecordRow | null>(null);
  // Bumped on every open so the edit form below always gets a fresh `key` — without
  // it, reopening to edit the same record twice in a row reuses the same form
  // instance. Its useActionState result stays { success: true } from the prior save,
  // and since `close` is a new function reference on every render, the form's "call
  // onSaved on success" effect re-fires on the next render and immediately closes
  // the dialog that was just reopened.
  const [formKey, setFormKey] = useState(0);
  const canEditAny = Boolean(currentUserId);
  const columnCount = canEditAny ? 6 : 5;

  const dailyRecordsByKey = new Map(
    dailyRecords.map((row) => [`${row.date}|${row.userId}`, row]),
  );

  function openEdit(u: UserTotal) {
    const row = dailyRecordsByKey.get(`${u.date}|${u.userId}`);
    if (!row) return;
    setEditing(toEditableRecord(row));
    setFormKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <section aria-labelledby="user-totals-heading" className="flex flex-col gap-3">
      {hideHeading ? (
        <h2 id="user-totals-heading" className="sr-only">
          {t("landing.totalsByUser")}
        </h2>
      ) : (
        <h2 id="user-totals-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          {t("landing.totalsByUser")}
        </h2>
      )}

      <div className="hidden overflow-hidden rounded-lg border border-foreground/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-foreground/[0.03] text-left text-foreground/60">
            <tr>
              <th className="px-4 py-2 font-medium">{t("table.user")}</th>
              <th className="px-4 py-2 font-medium">{t("table.queso")}</th>
              <th className="px-4 py-2 font-medium">{t("table.yogurt")}</th>
              <th className="px-4 py-2 font-medium">{t("table.milkMote")}</th>
              <th className="px-4 py-2 font-medium">{t("table.totalRevenue")}</th>
              {canEditAny ? <th className="px-4 py-2 font-medium" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {dayGroups.map((group) => (
              <Fragment key={group.date}>
                <tr>
                  <td colSpan={columnCount} className="p-0">
                    <DayHeaderButton date={group.date} title={t("salesCharts.showDay")} className="px-4 py-2" />
                  </td>
                </tr>
                {group.totals.map((u) => (
                  <tr key={`${u.date}-${u.userId}`}>
                    <td className="px-4 py-2 font-medium">{u.userName}</td>
                    <td className="px-4 py-2 font-semibold">{formatCurrency(u.quesoRevenue)}</td>
                    <td className="px-4 py-2 font-semibold">{formatCurrency(u.yogurtRevenue)}</td>
                    <td className="px-4 py-2 font-semibold">{formatCurrency(u.milkMoteRevenue)}</td>
                    <td
                      className={
                        u.isDailyWinner
                          ? "rounded-md bg-green-50 px-4 py-2 dark:bg-green-950/40"
                          : "px-4 py-2"
                      }
                    >
                      <TotalRevenueCell u={u} t={t} />
                    </td>
                    {canEditAny ? (
                      <td className="px-4 py-2 text-right">
                        {isAdmin || u.userId === currentUserId ? (
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="text-sm text-foreground/60 underline hover:text-foreground"
                          >
                            {t("table.edit")}
                          </button>
                        ) : null}
                      </td>
                    ) : null}
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
            <DayHeaderButton date={group.date} title={t("salesCharts.showDay")} className="rounded-md px-3 py-1.5" />
            <ul className="flex flex-col gap-2">
              {group.totals.map((u) => (
                <li
                  key={`${u.date}-${u.userId}`}
                  className="rounded-lg border border-foreground/10 p-3"
                >
                  <div className="font-medium">{u.userName}</div>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-foreground/60">{t("table.queso")}</p>
                      <div className="font-semibold">{formatCurrency(u.quesoRevenue)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">{t("table.yogurt")}</p>
                      <div className="font-semibold">{formatCurrency(u.yogurtRevenue)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">{t("table.milkMote")}</p>
                      <div className="font-semibold">{formatCurrency(u.milkMoteRevenue)}</div>
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
                      <p className="text-xs text-foreground/60">{t("table.totalRevenue")}</p>
                      <TotalRevenueCell u={u} t={t} />
                    </div>
                    {isAdmin || u.userId === currentUserId ? (
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="-m-2 p-2 text-sm text-foreground/60 underline hover:text-foreground"
                      >
                        {t("table.edit")}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Pagination {...pager} t={t} />

      <dialog
        ref={dialogRef}
        {...backdropClose}
        className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-lg border border-foreground/10 bg-background p-6 text-foreground"
      >
        <h3 className="mb-4 text-sm font-medium">{t("records.editRecord")}</h3>
        {editing ? (
          <EditRecordForm key={formKey} record={editing} onSaved={close} onCancel={close} t={t} />
        ) : null}
      </dialog>
    </section>
  );
}
