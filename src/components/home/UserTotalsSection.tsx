"use client";

import { LossMargin, loserBackgroundClass } from "@/components/sale-records/LossMargin";
import { TotalPayHeader } from "@/components/sale-records/TotalPayHeader";
import { totalSellerPay } from "@/lib/money/seller-pay";
import { Fragment, useRef, useState } from "react";
import { DayHeaderButton } from "@/components/sales-charts/DayHeaderButton";
import { LabeledAmount } from "@/components/sale-records/LabeledAmount";
import { formatCurrency } from "@/lib/money/pricing";
import { ProductCell } from "@/components/sale-records/ProductCell";
import { UserCell } from "@/components/sale-records/UserCell";
import {
  buildNetProfitAfterPayByDate,
  recordAdjustedRevenue,
  type UnitCosts,
  type GrainsDeductions,
} from "@/lib/money/revenue";
import { toEditableRecord } from "@/lib/editable-record";
import { EditRecordForm } from "@/components/sale-records/EditRecordForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow, DailyWorkRecordRow, UserTotal } from "@/types/daily-records";
import { useBackdropClose } from "@/hooks/useBackdropClose";
import { useGroupedPagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";
import { EditButton } from "@/components/ui/EditButton";

interface UserTotalsSectionProps {
  userTotals: UserTotal[];
  dailyRecords: DailyRecordRow[];
  currentUserId: string | null;
  isAdmin: boolean;
  // Admin-only cost inputs for the Net profit line; null for everyone else.
  unitCosts: UnitCosts | null;
  deductions: GrainsDeductions | null;
  hideHeading?: boolean;
  locale: Locale;
}

// Matches Sale Records' "sold" revenue: Queso + Yogurt + Milk & Mote, excluding
// the value of unsold ("left") product.
function soldRevenueOf(u: UserTotal): number {
  return u.queso.revenue + u.yogurt.revenue + u.milkMoteRevenue;
}

// Mirrors Sale Records' TotalRevenueCell: bold sold revenue, plus the remaining
// ("left") value and the full total (sold + left) as secondary text.
function UserName({ name }: { name: string }) {
  return <div className="font-medium break-words uppercase text-sky-700 dark:text-sky-400">{name}</div>;
}

function TotalRevenueCell({ u, t }: { u: UserTotal; t: TranslateFn }) {
  const soldRevenue = soldRevenueOf(u);
  const remainingValue = u.totalRevenue - soldRevenue;

  return (
    <>
      <div>
        <LabeledAmount label={t("cell.sold")} amount={formatCurrency(soldRevenue)} />
      </div>
      <div className="text-xs text-foreground/70">
        <LabeledAmount label={t("cell.unsold")} amount={formatCurrency(remainingValue)} prefix="+" />
      </div>
      {/* Written like a sum on paper: Total venta, "+" No vendidos, a line under the
          amounts, and the result below it. The label stays as tooltip / screen-reader text. */}
      <div
        title={t("cell.soldPlusUnsold")}
        aria-label={`${t("cell.soldPlusUnsold")}: ${formatCurrency(soldRevenue + remainingValue)}`}
        className="flex justify-end"
      >
        <span className="text-amount mt-0.5 border-t-2 border-foreground/70 pt-0.5 pl-8 text-right font-bold whitespace-nowrap tabular-nums text-amber-700 dark:text-amber-400">
          {formatCurrency(soldRevenue + remainingValue)}
        </span>
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
  unitCosts,
  deductions,
  hideHeading = false,
  locale,
}: UserTotalsSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const { pageItems: dayGroups, ...pager } = useGroupedPagination(groupByDay(userTotals), "totals");

  // The day's total Net profit minus seller pay for its header — admins only (unitCosts is null for
  // everyone else). Computed from every record, not just the current page, so a
  // day split across pages still shows its full total.
  const netProfitByDate = unitCosts ? buildNetProfitAfterPayByDate(dailyRecords, unitCosts, deductions ?? undefined) : null;
  function dayNetProfit(date: string) {
    const amount = netProfitByDate?.[date];
    if (amount === undefined) return null;
    return `${t("cell.earned")}: ${formatCurrency(amount)}`;
  }
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
  // A seller's pay over every day they worked, in the Edit column's header.
  const sellerTotal =
    currentUserId && !isAdmin
      ? totalSellerPay(
          userTotals.map((u) => ({ userId: u.userId, totalSold: soldRevenueOf(u) })),
          currentUserId,
        )
      : null;
  const columnCount = canEditAny ? 6 : 5;

  const dailyRecordsByKey = new Map(
    dailyRecords.map((row) => [`${row.date}|${row.userId}`, row]),
  );

  function netProfitOf(u: UserTotal): number | null {
    const row = dailyRecordsByKey.get(`${u.date}|${u.userId}`);
    if (!unitCosts || !row) return null;
    return recordAdjustedRevenue(row, unitCosts, deductions ?? undefined);
  }

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
          {t("home.totalsByUser")}
        </h2>
      ) : (
        <h2 id="user-totals-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/70">
          {t("home.totalsByUser")}
        </h2>
      )}

      <div className="hidden overflow-clip rounded-lg border border-foreground/10 md:block">
        <table className="w-full text-sm">
          {/* Header cells are pinned (sticky) under the panel bar while scrolling, so every
            column stays labeled; the wrapper uses overflow-clip, which keeps sticky working. */}
          <thead className="bg-foreground text-left text-xs uppercase tracking-wide text-background">
            {/* Vertical lines between columns (header and rows) so it's clear where each one ends. */}
            <tr className="divide-x divide-background/25">
              <th className="sticky top-[var(--sticky-offset,0px)] z-10 bg-foreground px-4 py-2 font-semibold">{t("table.user")}</th>
              <th className="sticky top-[var(--sticky-offset,0px)] z-10 bg-foreground px-4 py-2 font-semibold">{t("table.queso")}</th>
              <th className="sticky top-[var(--sticky-offset,0px)] z-10 bg-foreground px-4 py-2 font-semibold">{t("table.yogurt")}</th>
              <th className="sticky top-[var(--sticky-offset,0px)] z-10 bg-foreground px-4 py-2 font-semibold">{t("table.milkMote")}</th>
              <th className="sticky top-[var(--sticky-offset,0px)] z-10 bg-foreground px-4 py-2 font-semibold">{t("table.totalRevenue")}</th>
              {canEditAny ? <TotalPayHeader total={sellerTotal} t={t} /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {dayGroups.map((group) => (
              <Fragment key={group.date}>
                <tr>
                  <td colSpan={columnCount} className="p-0">
                    <DayHeaderButton
                      date={group.date}
                      title={t("salesCharts.showDay")}
                      className="px-4 py-2"
                      trailing={dayNetProfit(group.date)}
                    />
                  </td>
                </tr>
                {group.totals.map((u) => (
                  <tr key={`${u.date}-${u.userId}`} className="divide-x divide-foreground/15">
                    <td className="px-4 py-2">
                      {currentUserId ? (
                        <UserCell
                          name={<UserName name={u.userName} />}
                          totalSold={soldRevenueOf(u)}
                          netProfit={netProfitOf(u)}
                          showPay={isAdmin || u.userId === currentUserId}
                          payPaid={u.payPaid}
                          t={t}
                        />
                      ) : (
                        <UserName name={u.userName} />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <ProductCell breakdown={u.queso} t={t} />
                    </td>
                    <td className="px-4 py-2">
                      <ProductCell breakdown={u.yogurt} t={t} />
                    </td>
                    <td className={`px-4 py-2 ${loserBackgroundClass(u.lossMargin)}`}>
                      <div className="font-semibold">{formatCurrency(u.milkMoteRevenue)}</div>
                      {isAdmin ? <LossMargin lossMargin={u.lossMargin} t={t} /> : null}
                    </td>
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
                          <EditButton onClick={() => openEdit(u)} label={t("table.edit")} />
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
            <DayHeaderButton
              date={group.date}
              title={t("salesCharts.showDay")}
              className="rounded-md px-3 py-1.5"
              trailing={dayNetProfit(group.date)}
            />
            <ul className="flex flex-col gap-3">
              {group.totals.map((u) => (
                <li
                  key={`${u.date}-${u.userId}`}
                  className="rounded-lg border border-foreground/25 border-l-4 border-l-sky-600 bg-foreground/[0.03] p-3 shadow-sm dark:border-l-sky-400"
                >
                  {currentUserId ? (
                    <UserCell
                      name={<UserName name={u.userName} />}
                      totalSold={soldRevenueOf(u)}
                      netProfit={netProfitOf(u)}
                      showPay={isAdmin || u.userId === currentUserId}
                      payPaid={u.payPaid}
                      t={t}
                    />
                  ) : (
                    <UserName name={u.userName} />
                  )}
                  {/* One column like the Sale Records cards: the Queso / Yogurt lines never
                      wrap, so they need the card's full width on a phone. */}
                  <div className="mt-2 flex flex-col gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("table.queso")}</p>
                      <ProductCell breakdown={u.queso} t={t} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("table.yogurt")}</p>
                      <ProductCell breakdown={u.yogurt} t={t} />
                    </div>
                    <div className={u.lossMargin === null ? "" : `p-2 ${loserBackgroundClass(u.lossMargin)}`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("table.milkMote")}</p>
                        <div className="font-semibold tabular-nums">{formatCurrency(u.milkMoteRevenue)}</div>
                      </div>
                      {isAdmin ? <LossMargin lossMargin={u.lossMargin} t={t} /> : null}
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("table.totalRevenue")}</p>
                      <TotalRevenueCell u={u} t={t} />
                    </div>
                    {isAdmin || u.userId === currentUserId ? (
                      <EditButton onClick={() => openEdit(u)} label={t("table.edit")} />
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
