"use client";

import { Fragment, useRef, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
import { formatShortDate } from "@/lib/dates";
import { CreateGrainPurchaseForm } from "@/components/admin/grain-purchases/CreateGrainPurchaseForm";
import { EditStockPurchaseForm } from "@/components/admin/stock-purchases/EditStockPurchaseForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { GrainProduct, StockPurchaseRow } from "@/types/admin";

interface GrainPurchasesSectionProps {
  purchases: StockPurchaseRow[];
  locale: Locale;
}

type Mode = { type: "create" } | { type: "edit"; purchase: StockPurchaseRow };

const GRAIN_LABEL_KEYS: Record<GrainProduct, string> = {
  MAIZ_PELADO: "product.maizPelado",
  MAIZ_CASCARA: "product.maizCascara",
  HABA: "product.haba",
};

function itemLabel(purchase: StockPurchaseRow, t: TranslateFn): string {
  const key = GRAIN_LABEL_KEYS[purchase.product as GrainProduct];
  return key ? t(key) : purchase.product;
}

interface DayGroup {
  date: string;
  purchases: StockPurchaseRow[];
  totalCost: number;
}

// purchases arrives sorted by createdAt descending; grouping preserves that order
// within each day while ordering the days themselves by date descending — same
// pattern as SaleRecordsSection/UserTotalsSection.
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

// Unlike Cheese/Yogurt/Milk (one fixed product per page), this page covers three
// grain items picked per-purchase from a dropdown — all quartilla-priced, purchases
// only, no "current stock" figure (same treatment Milk and the old single-item
// Maiz page had, just without a fixed product to key the page on).
export function GrainPurchasesSection({ purchases, locale }: GrainPurchasesSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const quantityLabel = t("stock.quantityQuartilla");
  const unitCostLabel = t("stock.unitCostQuartilla");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>({ type: "create" });
  // See StockPurchasesSection for why this is needed: without a fresh `key` on every
  // open, reopening in the same mode reuses the same form instance, whose stale
  // success state re-closes the dialog as soon as it's reopened.
  const [formKey, setFormKey] = useState(0);
  const dayGroups = groupByDay(purchases);

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
    <section aria-labelledby="grain-purchases-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          id="grain-purchases-heading"
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
                  <th className="px-4 py-2 font-medium">{t("grains.item")}</th>
                  <th className="px-4 py-2 font-medium">{quantityLabel}</th>
                  <th className="px-4 py-2 font-medium">{unitCostLabel}</th>
                  <th className="px-4 py-2 font-medium">{t("stock.totalCost")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.setBy")}</th>
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
                        <td className="px-4 py-2 font-medium">{itemLabel(purchase, t)}</td>
                        <td className="px-4 py-2">{purchase.quantity}</td>
                        <td className="px-4 py-2">{formatCurrency(purchase.unitCost)}</td>
                        <td className="px-4 py-2 font-medium">
                          {formatCurrency(purchase.quantity * purchase.unitCost)}
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
                  <span>{formatCurrency(group.totalCost)}</span>
                </p>
                <ul className="flex flex-col gap-2">
                  {group.purchases.map((purchase) => (
                    <li key={purchase.id} className="rounded-lg border border-foreground/10 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{itemLabel(purchase, t)}</p>
                          <p className="text-xs text-foreground/60">
                            {t("stock.quantityUnitQuartilla", { quantity: purchase.quantity })}
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
          {mode.type === "create" ? t("stock.newPurchase") : `${t("stock.editPurchase")} — ${itemLabel(mode.purchase, t)}`}
        </h3>
        {mode.type === "create" ? (
          <CreateGrainPurchaseForm
            key={formKey}
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
