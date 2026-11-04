"use client";

import { Fragment, useRef, useState } from "react";
import { EmphasizedText } from "@/components/landing/EmphasizedText";
import { LabeledAmount } from "@/components/landing/LabeledAmount";
import { formatCurrency } from "@/lib/pricing";
import { DayHeaderButton } from "@/components/sales-charts/DayHeaderButton";
import { toEditableRecord } from "@/lib/records";
import { sellerPay } from "@/lib/seller-pay";
import { recordAdjustedRevenue, type UnitCosts, type MilkGrainsDeductions } from "@/lib/revenue";
import { CreateRecordForm } from "@/components/records/CreateRecordForm";
import { EditRecordForm } from "@/components/records/EditRecordForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { DailyRecordRow, ProductBreakdown } from "@/types/landing";
import type { DailyWorkRecordRow } from "@/types/records";
import { useBackdropClose } from "@/hooks/useBackdropClose";
import { useGroupedPagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";

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

function ProductCell({ breakdown, t }: { breakdown: ProductBreakdown; t: TranslateFn }) {
  return (
    <>
      <div className="text-xs text-foreground/60">
        <EmphasizedText
          template={t("cell.soldWithRevenue")}
          values={{ sold: breakdown.sold, revenue: formatCurrency(breakdown.revenue) }}
          emphasize={["revenue"]}
        />
      </div>
      <div className="text-xs text-foreground/60">
        <EmphasizedText
          template={t("cell.takenLeft")}
          values={{
            taken: breakdown.taken,
            remaining: breakdown.remaining,
            remainingValue: formatCurrency(breakdown.remainingValue),
          }}
          emphasize={["remainingValue"]}
        />
      </div>
    </>
  );
}

function TotalRevenueCell({
  row,
  t,
  isAdmin,
  showPay,
  unitCosts,
  deductions,
}: {
  row: DailyRecordRow;
  t: TranslateFn;
  // Only admins see the winner's margin; everyone else sees just "Winner".
  isAdmin: boolean;
  // Seller pay is shown to admins on every row and to a seller on their own rows only.
  showPay: boolean;
  unitCosts: UnitCosts | null;
  deductions: MilkGrainsDeductions | null;
}) {
  const soldRevenue =
    row.queso.revenue + row.yogurt.revenue + row.milkMoteRevenue;
  const remainingValue = row.queso.remainingValue + row.yogurt.remainingValue;

  return (
    <>
      <div>
        <LabeledAmount label={t("cell.sold")} amount={formatCurrency(soldRevenue)} />
        {row.isDailyWinner && (
          <span className="ml-2 text-xs font-medium text-green-700 dark:text-green-400">
            {isAdmin && row.winnerMargin !== null
              ? t("cell.winnerMargin", { margin: formatCurrency(row.winnerMargin) })
              : t("cell.winner")}
          </span>
        )}
      </div>
      <div className="text-xs text-foreground/60">
        <LabeledAmount label={t("cell.unsold")} amount={formatCurrency(remainingValue)} />
      </div>
      <div className="text-xs text-foreground/60">
        <LabeledAmount label={t("cell.soldPlusUnsold")} amount={formatCurrency(row.totalRevenue)} />
      </div>
      {showPay ? <SellerPayLine row={row} t={t} /> : null}
      {unitCosts ? (
        <div className="text-xs text-foreground/60">
          <LabeledAmount
            label={t("cell.earned")}
            amount={formatCurrency(recordAdjustedRevenue(row, unitCosts, deductions ?? undefined))}
          />
        </div>
      ) : null}
    </>
  );
}

function SellerPayLine({ row, t }: { row: DailyRecordRow; t: TranslateFn }) {
  return (
    <div className="text-xs text-foreground/60">
      <LabeledAmount label={t("cell.sellerPay")} amount={formatCurrency(sellerPay(row.totalSold))} />
    </div>
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
    <section aria-labelledby="records-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          id="records-heading"
          className="text-sm font-medium uppercase tracking-wide text-foreground/60"
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

      <div className="hidden overflow-x-auto rounded-lg border border-foreground/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-foreground/[0.03] text-left text-foreground/60">
            <tr>
              <th className="px-4 py-2 font-medium">{t("table.user")}</th>
              <th className="px-4 py-2 font-medium">{t("table.queso")}</th>
              <th className="px-4 py-2 font-medium">{t("table.yogurt")}</th>
              <th className="px-4 py-2 font-medium">{t("table.milkMote")}</th>
              <th className="px-4 py-2 font-medium">{t("saleRecords.totalRevenue")}</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {dayGroups.map((group) => (
              <Fragment key={group.date}>
                <tr>
                  <td colSpan={6} className="p-0">
                    <DayHeaderButton date={group.date} title={t("salesCharts.showDay")} className="px-4 py-2" />
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2 font-medium">{row.userName}</td>
                    <td className="px-4 py-2">
                      <ProductCell breakdown={row.queso} t={t} />
                    </td>
                    <td className="px-4 py-2">
                      <ProductCell breakdown={row.yogurt} t={t} />
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      {formatCurrency(row.milkMoteRevenue)}
                    </td>
                    <td
                      className={
                        row.isDailyWinner
                          ? "rounded-md bg-green-50 px-4 py-2 dark:bg-green-950/40"
                          : "px-4 py-2"
                      }
                    >
                      <TotalRevenueCell
                        row={row}
                        t={t}
                        isAdmin={isAdmin}
                        showPay={isAdmin || row.userId === currentUserId}
                        unitCosts={unitCosts}
                        deductions={deductions}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isAdmin || row.userId === currentUserId ? (
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="text-sm text-foreground/60 underline hover:text-foreground"
                        >
                          {t("table.edit")}
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
            <DayHeaderButton date={group.date} title={t("salesCharts.showDay")} className="rounded-md px-3 py-1.5" />
            <ul className="flex flex-col gap-2">
              {group.rows.map((row) => (
                <li key={row.id} className="rounded-lg border border-foreground/10 p-3">
                  <div className="font-medium">{row.userName}</div>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-foreground/60">{t("table.queso")}</p>
                      <ProductCell breakdown={row.queso} t={t} />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">{t("table.yogurt")}</p>
                      <ProductCell breakdown={row.yogurt} t={t} />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">{t("table.milkMote")}</p>
                      <div className="font-semibold">
                        {formatCurrency(row.milkMoteRevenue)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={
                      row.isDailyWinner
                        ? "mt-2 flex items-end justify-between rounded-md border-t border-foreground/10 bg-green-50 p-2 pt-2 text-sm dark:bg-green-950/40"
                        : "mt-2 flex items-end justify-between border-t border-foreground/10 pt-2 text-sm"
                    }
                  >
                    <div>
                      <p className="text-xs text-foreground/60">{t("saleRecords.totalRevenue")}</p>
                      <TotalRevenueCell
                        row={row}
                        t={t}
                        isAdmin={isAdmin}
                        showPay={isAdmin || row.userId === currentUserId}
                        unitCosts={unitCosts}
                        deductions={deductions}
                      />
                    </div>
                    {isAdmin || row.userId === currentUserId ? (
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
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
