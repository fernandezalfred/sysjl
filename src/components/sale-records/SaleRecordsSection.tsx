"use client";

import { WinnerBadge } from "@/components/sale-records/WinnerBadge";
import { Fragment, useRef, useState } from "react";
import { LabeledAmount } from "@/components/sale-records/LabeledAmount";
import { ProductCell } from "@/components/sale-records/ProductCell";
import { formatCurrency } from "@/lib/money/pricing";
import { DayHeaderButton } from "@/components/sales-charts/DayHeaderButton";
import { toEditableRecord } from "@/lib/editable-record";
import { UserCell } from "@/components/sale-records/UserCell";
import {
  buildNetProfitAfterPayByDate,
  recordAdjustedRevenue,
  type UnitCosts,
  type MilkGrainsDeductions,
} from "@/lib/money/revenue";
import { CreateRecordForm } from "@/components/sale-records/CreateRecordForm";
import { EditRecordForm } from "@/components/sale-records/EditRecordForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow, DailyWorkRecordRow } from "@/types/daily-records";
import { useBackdropClose } from "@/hooks/useBackdropClose";
import { useGroupedPagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";
import { EditButton } from "@/components/ui/EditButton";

interface SaleRecordsSectionProps {
  dailyRecords: DailyRecordRow[];
  currentUserId: string | null;
  currentUserName: string | null;
  isAdmin: boolean;
  activeUsers: { id: string; name: string }[];
  locale: Locale;
  unitCosts: UnitCosts | null;
  deductions: MilkGrainsDeductions | null;
}

type Mode = { type: "create" } | { type: "edit"; record: DailyWorkRecordRow };

function UserName({ name }: { name: string }) {
  return <div className="text-sm font-medium break-words uppercase text-sky-700 dark:text-sky-400">{name}</div>;
}

function TotalRevenueCell({ row, t }: { row: DailyRecordRow; t: TranslateFn }) {
  const soldRevenue =
    row.queso.revenue + row.yogurt.revenue + row.milkMoteRevenue;
  const remainingValue = row.queso.remainingValue + row.yogurt.remainingValue;

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
  rows: DailyRecordRow[];
}

// dailyRecords arrives sorted by createdAt descending; grouping preserves that
// order within each day while ordering the days themselves by date descending.
function groupByDay(rows: DailyRecordRow[]): DayGroup[] {
  const map = new Map<string, DailyRecordRow[]>();
  for (const row of rows) {
    const group = map.get(row.date);
    if (group) {
      group.push(row);
    } else {
      map.set(row.date, [row]);
    }
  }

  return Array.from(map.entries())
    .map(([date, groupRows]) => ({ date, rows: groupRows }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function SaleRecordsSection({
  dailyRecords,
  currentUserId,
  currentUserName,
  isAdmin,
  activeUsers,
  locale,
  unitCosts,
  deductions,
}: SaleRecordsSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropClose = useBackdropClose();
  const [mode, setMode] = useState<Mode>({ type: "create" });
  // Bumped on every open so the create/edit form below always gets a fresh `key` —
  // without it, reopening in the same mode twice in a row (e.g. "New record" after
  // a successful create) reuses the same form instance. Its useActionState result
  // stays { success: true } from the prior save, and since `close` is a new function
  // reference on every render, the form's "call onSaved on success" effect re-fires
  // on the next render and immediately closes the dialog that was just reopened.
  const [formKey, setFormKey] = useState(0);
  const { pageItems: dayGroups, ...pager } = useGroupedPagination(groupByDay(dailyRecords), "rows");

  // The day's total Net profit minus seller pay for its header — admins only (unitCosts is null for
  // everyone else). Computed from every record, not just the current page, so a
  // day split across pages still shows its full total.
  const netProfitByDate = unitCosts ? buildNetProfitAfterPayByDate(dailyRecords, unitCosts, deductions ?? undefined) : null;
  function dayNetProfit(date: string) {
    const amount = netProfitByDate?.[date];
    if (amount === undefined) return null;
    return `${t("cell.earned")}: ${formatCurrency(amount)}`;
  }

  function netProfitOf(row: DailyRecordRow): number | null {
    return unitCosts ? recordAdjustedRevenue(row, unitCosts, deductions ?? undefined) : null;
  }

  function openCreate() {
    setMode({ type: "create" });
    setFormKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function openEdit(row: DailyRecordRow) {
    setMode({ type: "edit", record: toEditableRecord(row) });
    setFormKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <section aria-labelledby="records-heading" className="@container/records flex flex-col gap-3">
      {/* A named size container: table vs cards, and one vs two card columns, follow the
          width this section actually has (the panel sidebar takes part of the screen),
          not the screen width. */}
      <div className="flex items-center justify-between">
        <h2
          id="records-heading"
          className="text-sm font-medium uppercase tracking-wide text-foreground/70"
        >
          {t("saleRecords.heading")}
        </h2>
        {currentUserId ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
          >
            {t("saleRecords.newRecord")}
          </button>
        ) : null}
      </div>

      {/* Full table only when the section is at least 70rem (1120px) wide: six columns
          kept on one line at the larger text sizes need about that much. */}
      <div className="fluid-text fluid-text-wide hidden overflow-clip rounded-lg border border-foreground/10 @min-[70rem]/records:block">
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
              <th className="sticky top-[var(--sticky-offset,0px)] z-10 bg-foreground px-4 py-2 font-semibold">{t("saleRecords.totalRevenue")}</th>
              <th className="sticky top-[var(--sticky-offset,0px)] z-10 bg-foreground px-4 py-2 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {dayGroups.map((group) => (
              <Fragment key={group.date}>
                <tr>
                  <td colSpan={6} className="p-0">
                    <DayHeaderButton
                      date={group.date}
                      title={t("salesCharts.showDay")}
                      className="px-4 py-2"
                      trailing={dayNetProfit(group.date)}
                    />
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.id} className="divide-x divide-foreground/15 align-top">
                    <td className="px-4 py-2">
                      {currentUserId ? (
                        <UserCell
                          name={<UserName name={row.userName} />}
                          totalSold={row.totalSold}
                          netProfit={netProfitOf(row)}
                          t={t}
                        />
                      ) : (
                        <UserName name={row.userName} />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <ProductCell breakdown={row.queso} t={t} />
                    </td>
                    <td className="px-4 py-2">
                      <ProductCell breakdown={row.yogurt} t={t} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-amount whitespace-nowrap font-semibold">{formatCurrency(row.milkMoteRevenue)}</div>
                      <WinnerBadge
                        isDailyWinner={row.isDailyWinner}
                        winnerMargin={row.winnerMargin}
                        isAdmin={isAdmin}
                        t={t}
                      />
                    </td>
                    <td
                      className={
                        row.isDailyWinner
                          ? "rounded-md bg-green-50 px-4 py-2 dark:bg-green-950/40"
                          : "px-4 py-2"
                      }
                    >
                      <TotalRevenueCell row={row} t={t} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isAdmin || row.userId === currentUserId ? (
                        <EditButton onClick={() => openEdit(row)} label={t("table.edit")} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards when the table doesn't fit: one column, two once the section is 44rem
          (704px) wide so each card still has ~350px. */}
      <div className="flex flex-col gap-3 @min-[70rem]/records:hidden">
        {dayGroups.map((group) => (
          <div key={group.date} className="fluid-text flex flex-col gap-2">
            <DayHeaderButton
              date={group.date}
              title={t("salesCharts.showDay")}
              className="rounded-md px-3 py-1.5"
              trailing={dayNetProfit(group.date)}
            />
            <ul className="grid grid-cols-1 gap-3 @min-[44rem]/records:grid-cols-2">
              {group.rows.map((row) => (
                <li key={row.id} className="fluid-text @container rounded-lg border border-foreground/25 border-l-4 border-l-sky-600 bg-foreground/[0.03] p-3 shadow-sm dark:border-l-sky-400">
                  {/* One column, capped at max-w-sm, so every amount on the card lines up at
                      the same right edge and never drifts far from its label. */}
                  <div className="max-w-sm">
                    {currentUserId ? (
                      <UserCell
                        name={
                          <div className="flex items-start gap-2">
                            <UserName name={row.userName} />
                            {isAdmin || row.userId === currentUserId ? (
                              <EditButton onClick={() => openEdit(row)} label={t("table.edit")} />
                            ) : null}
                          </div>
                        }
                        totalSold={row.totalSold}
                        netProfit={netProfitOf(row)}
                        t={t}
                      />
                    ) : (
                      <UserName name={row.userName} />
                    )}
                    <div className="mt-2 flex flex-col gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("table.queso")}</p>
                        <ProductCell breakdown={row.queso} t={t} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("table.yogurt")}</p>
                        <ProductCell breakdown={row.yogurt} t={t} />
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("table.milkMote")}</p>
                          <div className="text-amount whitespace-nowrap font-semibold tabular-nums">
                            {formatCurrency(row.milkMoteRevenue)}
                          </div>
                        </div>
                        <WinnerBadge
                          isDailyWinner={row.isDailyWinner}
                          winnerMargin={row.winnerMargin}
                          isAdmin={isAdmin}
                          t={t}
                        />
                      </div>
                    </div>
                    {/* The winner's green background bleeds 8px past the column (-mx-2 px-2)
                        so its amounts stay aligned with the rows above. */}
                    <div
                      className={
                        row.isDailyWinner
                          ? "-mx-2 mt-2 rounded-md border-t border-foreground/10 bg-green-50 px-2 py-2 text-sm dark:bg-green-950/40"
                          : "mt-2 border-t border-foreground/10 pt-2 text-sm"
                      }
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("saleRecords.totalRevenue")}</p>
                      <TotalRevenueCell row={row} t={t} />
                    </div>
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
        <h3 className="mb-4 text-sm font-medium">
          {mode.type === "create" ? t("records.newRecord") : t("records.editRecord")}
        </h3>
        {mode.type === "create" ? (
          <CreateRecordForm
            key={formKey}
            onSaved={close}
            onCancel={close}
            isAdmin={isAdmin}
            activeUsers={activeUsers}
            currentUserName={currentUserName}
            t={t}
          />
        ) : (
          <EditRecordForm key={formKey} record={mode.record} onSaved={close} onCancel={close} t={t} />
        )}
      </dialog>
    </section>
  );
}
