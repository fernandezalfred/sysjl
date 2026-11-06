"use client";

import { Fragment, useRef, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
import { formatShortDate } from "@/lib/dates";
import { CreateMilkPurchaseForm } from "@/components/admin/milk-purchases/CreateMilkPurchaseForm";
import { EditStockPurchaseForm } from "@/components/admin/stock-purchases/EditStockPurchaseForm";
import { RepeatLastDayButton } from "@/components/admin/stock-purchases/RepeatLastDayButton";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { StockPurchaseRow } from "@/types/admin";
import { useBackdropClose } from "@/hooks/useBackdropClose";
import { useGroupedPagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";
import { EditButton } from "@/components/ui/EditButton";

interface MilkPurchasesSectionProps {
  purchases: StockPurchaseRow[];
  activeUsers: { id: string; name: string }[];
  locale: Locale;
}

type Mode = { type: "create" } | { type: "edit"; purchase: StockPurchaseRow };

interface DayGroup {
  date: string;
  purchases: StockPurchaseRow[];
  totalCost: number;
}

// purchases arrives sorted by createdAt descending; grouping preserves that order
// within each day while ordering the days themselves by date descending — same
// pattern as SaleRecordsSection/UserTotalsSection/GrainPurchasesSection.
function groupByDay(purchases: StockPurchaseRow[]): DayGroup[] {
  const map = new Map<string, StockPurchaseRow[]>();
  for (const purchase of purchases) {
    const group = map.get(purchase.createdAtDate);
    if (group) {
      group.push(purchase);
    } else {
      map.set(purchase.createdAtDate, [purchase]);
    }
  }

  return Array.from(map.entries())
    .map(([date, groupPurchases]) => ({
      date,
      purchases: groupPurchases,
      totalCost: groupPurchases.reduce((sum, p) => sum + p.quantity * p.unitCost, 0),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Unlike Cheese/Yogurt (AdminProductStockPage/StockPurchasesSection), Milk purchases
// are attributed to the driver they're for (picked on create), grouped by day with a
// per-day total cost, and have no "current stock" figure — Milk has no quantity-level
// sales tracking to derive one from.
export function MilkPurchasesSection({ purchases, activeUsers, locale }: MilkPurchasesSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const quantityLabel = t("stock.quantityLiters");
  const unitCostLabel = t("stock.unitCostLiters");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropClose = useBackdropClose();
  const [mode, setMode] = useState<Mode>({ type: "create" });
  // See StockPurchasesSection for why this is needed: without a fresh `key` on every
  // open, reopening in the same mode reuses the same form instance, whose stale
  // success state re-closes the dialog as soon as it's reopened.
  const [formKey, setFormKey] = useState(0);
  const { pageItems: dayGroups, ...pager } = useGroupedPagination(groupByDay(purchases), "purchases");

  function openCreate() {
    setMode({ type: "create" });
    setFormKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function openEdit(purchase: StockPurchaseRow) {
    setMode({ type: "edit", purchase });
    setFormKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <section aria-labelledby="milk-purchases-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="milk-purchases-heading"
          className="text-sm font-medium uppercase tracking-wide text-foreground/70"
        >
          {t("stock.purchaseHistory")}
        </h2>
        <div className="flex items-start gap-2">
          <RepeatLastDayButton kind="MILK" t={t} />
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
          >
            {t("stock.newPurchase")}
          </button>
        </div>
      </div>

      {purchases.length === 0 ? (
        <p className="text-sm text-foreground/70">{t("stock.noPurchases")}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-foreground/10 md:block">
            <table className="w-full text-sm">
              <thead className="bg-foreground/[0.03] text-left text-foreground/70">
                <tr>
                  <th className="px-4 py-2 font-medium">{quantityLabel}</th>
                  <th className="px-4 py-2 font-medium">{unitCostLabel}</th>
                  <th className="px-4 py-2 font-medium">{t("stock.totalCost")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.setBy")}</th>
                  <th className="px-4 py-2 font-medium">{t("milk.forDriver")}</th>
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
                        <div className="flex items-center justify-between">
                          <span>{formatShortDate(group.date)}</span>
                          <span>
                            {t("stock.totalCost")}: {formatCurrency(group.totalCost)}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {group.purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-4 py-2">{purchase.quantity}</td>
                        <td className="px-4 py-2">{formatCurrency(purchase.unitCost)}</td>
                        <td className="px-4 py-2 font-medium">
                          {formatCurrency(purchase.quantity * purchase.unitCost)}
                        </td>
                        <td className="px-4 py-2">{purchase.createdByName}</td>
                        <td className="px-4 py-2">{purchase.forUserName ?? "—"}</td>
                        <td className="px-4 py-2 text-right">
                          <EditButton onClick={() => openEdit(purchase)} label={t("table.edit")} />
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
                <p className="flex items-center justify-between rounded-md bg-foreground/10 px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-foreground dark:bg-foreground/15">
                  <span>{formatShortDate(group.date)}</span>
                  <span>{formatCurrency(group.totalCost)}</span>
                </p>
                <ul className="flex flex-col gap-2">
                  {group.purchases.map((purchase) => (
                    <li key={purchase.id} className="rounded-lg border border-foreground/10 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {t("stock.quantityUnitLiters", { quantity: purchase.quantity })}
                          </p>
                          <p className="text-xs text-foreground/70">
                            {unitCostLabel}: {formatCurrency(purchase.unitCost)}
                          </p>
                          <p className="text-xs text-foreground/70">
                            {t("adminProducts.setBy")}: {purchase.createdByName}
                          </p>
                          <p className="text-xs text-foreground/70">
                            {t("milk.forDriver")}: {purchase.forUserName ?? "—"}
                          </p>
                        </div>
                        <EditButton onClick={() => openEdit(purchase)} label={t("table.edit")} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination {...pager} t={t} />

      <dialog
        ref={dialogRef}
        {...backdropClose}
        className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-lg border border-foreground/10 bg-background p-6 text-foreground"
      >
        <h3 className="mb-4 text-sm font-medium">
          {mode.type === "create"
            ? t("stock.newPurchase")
            : `${t("stock.editPurchase")} — ${mode.purchase.forUserName ?? mode.purchase.createdByName}`}
        </h3>
        {mode.type === "create" ? (
          <CreateMilkPurchaseForm
            key={formKey}
            quantityLabel={quantityLabel}
            unitCostLabel={unitCostLabel}
            activeUsers={activeUsers}
            onSaved={close}
            onCancel={close}
            t={t}
          />
        ) : (
          <EditStockPurchaseForm
            key={formKey}
            purchase={mode.purchase}
            quantityLabel={quantityLabel}
            unitCostLabel={unitCostLabel}
            onSaved={close}
            onCancel={close}
            t={t}
          />
        )}
      </dialog>
    </section>
  );
}
