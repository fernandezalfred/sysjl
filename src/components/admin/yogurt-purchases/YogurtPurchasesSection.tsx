"use client";

import { Fragment, useRef, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
import { formatShortDate } from "@/lib/dates";
import { CreateStockPurchaseForm } from "@/components/admin/stock-purchases/CreateStockPurchaseForm";
import { EditStockPurchaseForm } from "@/components/admin/stock-purchases/EditStockPurchaseForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { StockPurchaseRow } from "@/types/admin";

interface YogurtPurchasesSectionProps {
  purchases: StockPurchaseRow[];
  salePrice: number;
  locale: Locale;
}

type Mode = { type: "create" } | { type: "edit"; purchase: StockPurchaseRow };

interface DayGroup {
  date: string;
  purchases: StockPurchaseRow[];
  totalEarning: number;
}

function earning(purchase: StockPurchaseRow, salePrice: number): number {
  return purchase.quantity * (salePrice - purchase.unitCost);
}

// purchases arrives sorted by createdAt descending; grouping preserves that order
// within each day while ordering the days themselves by date descending — same
// pattern as SaleRecordsSection/UserTotalsSection/GrainPurchasesSection/MilkPurchasesSection.
function groupByDay(purchases: StockPurchaseRow[], salePrice: number): DayGroup[] {
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
      totalEarning: groupPurchases.reduce((sum, p) => sum + earning(p, salePrice), 0),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Unlike Cheese (AdminProductStockPage/StockPurchasesSection), Yogurt groups its
// purchase history by day with a per-day total, and shows each purchase/day's
// earning (margin at the current sale price) instead of its cost.
export function YogurtPurchasesSection({ purchases, salePrice, locale }: YogurtPurchasesSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const quantityLabel = t("stock.quantity");
  const unitCostLabel = t("stock.unitCost");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>({ type: "create" });
  // See StockPurchasesSection for why this is needed: without a fresh `key` on every
  // open, reopening in the same mode reuses the same form instance, whose stale
  // success state re-closes the dialog as soon as it's reopened.
  const [formKey, setFormKey] = useState(0);
  const dayGroups = groupByDay(purchases, salePrice);

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
    <section aria-labelledby="yogurt-purchases-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          id="yogurt-purchases-heading"
          className="text-sm font-medium uppercase tracking-wide text-foreground/60"
        >
          {t("stock.purchaseHistory")}
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
        >
          {t("stock.newPurchase")}
        </button>
      </div>

      {purchases.length === 0 ? (
        <p className="text-sm text-foreground/60">{t("stock.noPurchases")}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-foreground/10 md:block">
            <table className="w-full text-sm">
              <thead className="bg-foreground/[0.03] text-left text-foreground/60">
                <tr>
                  <th className="px-4 py-2 font-medium">{quantityLabel}</th>
                  <th className="px-4 py-2 font-medium">{unitCostLabel}</th>
                  <th className="px-4 py-2 font-medium">{t("stock.earning")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.setBy")}</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {dayGroups.map((group) => (
                  <Fragment key={group.date}>
                    <tr className="bg-foreground/10 dark:bg-foreground/15">
                      <td
                        colSpan={5}
                        className="px-4 py-2 text-sm font-semibold uppercase tracking-wide text-foreground"
                      >
                        <div className="flex items-center justify-between">
                          <span>{formatShortDate(group.date)}</span>
                          <span>
                            {t("stock.earning")}: {formatCurrency(group.totalEarning)}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {group.purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-4 py-2">{purchase.quantity}</td>
                        <td className="px-4 py-2">{formatCurrency(purchase.unitCost)}</td>
                        <td className="px-4 py-2 font-medium">
                          {formatCurrency(earning(purchase, salePrice))}
                        </td>
                        <td className="px-4 py-2">{purchase.createdByName}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(purchase)}
                            className="text-sm text-foreground/60 underline hover:text-foreground"
                          >
                            {t("table.edit")}
                          </button>
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
                  <span>{formatCurrency(group.totalEarning)}</span>
                </p>
                <ul className="flex flex-col gap-2">
                  {group.purchases.map((purchase) => (
                    <li key={purchase.id} className="rounded-lg border border-foreground/10 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {t("stock.quantityUnit", { quantity: purchase.quantity })}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {unitCostLabel}: {formatCurrency(purchase.unitCost)}
                          </p>
                          <p className="text-xs text-foreground/60">{purchase.createdByName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEdit(purchase)}
                          className="text-sm text-foreground/60 underline hover:text-foreground"
                        >
                          {t("table.edit")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-foreground/10 bg-background p-6 text-foreground"
      >
        <h3 className="mb-4 text-sm font-medium">
          {mode.type === "create" ? t("stock.newPurchase") : t("stock.editPurchase")}
        </h3>
        {mode.type === "create" ? (
          <CreateStockPurchaseForm
            key={formKey}
            product="YOGURT"
            quantityLabel={quantityLabel}
            unitCostLabel={unitCostLabel}
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
