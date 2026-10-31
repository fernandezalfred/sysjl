"use client";

import { useRef, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
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

// Unlike Cheese/Yogurt/Milk (one fixed product per page), this page covers three
// grain items picked per-purchase from a dropdown — all quintal-priced, purchases
// only, no "current stock" figure (same treatment Milk and the old single-item
// Maiz page had, just without a fixed product to key the page on).
export function GrainPurchasesSection({ purchases, locale }: GrainPurchasesSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const quantityLabel = t("stock.quantityQuintal");
  const unitCostLabel = t("stock.unitCostQuintal");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>({ type: "create" });
  // See StockPurchasesSection for why this is needed: without a fresh `key` on every
  // open, reopening in the same mode reuses the same form instance, whose stale
  // success state re-closes the dialog as soon as it's reopened.
  const [formKey, setFormKey] = useState(0);

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
                  <th className="px-4 py-2 font-medium">{t("adminProducts.date")}</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-4 py-2 font-medium">{itemLabel(purchase, t)}</td>
                    <td className="px-4 py-2">{purchase.quantity}</td>
                    <td className="px-4 py-2">{formatCurrency(purchase.unitCost)}</td>
                    <td className="px-4 py-2 font-medium">
                      {formatCurrency(purchase.quantity * purchase.unitCost)}
                    </td>
                    <td className="px-4 py-2">{purchase.createdByName}</td>
                    <td className="px-4 py-2">{purchase.createdAtFormatted}</td>
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
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {purchases.map((purchase) => (
              <li key={purchase.id} className="rounded-lg border border-foreground/10 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{itemLabel(purchase, t)}</p>
                    <p className="text-xs text-foreground/60">
                      {t("stock.quantityUnitQuintal", { quantity: purchase.quantity })}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {unitCostLabel}: {formatCurrency(purchase.unitCost)}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {purchase.createdByName} · {purchase.createdAtFormatted}
                    </p>
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
