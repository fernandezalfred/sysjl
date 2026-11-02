"use client";

import { useRef, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
import { CreateStockPurchaseForm } from "@/components/admin/stock-purchases/CreateStockPurchaseForm";
import { EditStockPurchaseForm } from "@/components/admin/stock-purchases/EditStockPurchaseForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { StockPurchaseRow, SingleStockProduct } from "@/types/admin";

interface StockPurchasesSectionProps {
  purchases: StockPurchaseRow[];
  product: SingleStockProduct;
  locale: Locale;
}

type Mode = { type: "create" } | { type: "edit"; purchase: StockPurchaseRow };

// Queso/Yogurt are bought/costed by plain count. (Milk has its own section now;
// Maiz Pelado, Maiz Cascara, and Haba are quartilla-priced and live on the
// dropdown-based /admin/grains page, not here — see GrainPurchasesSection.)
const QUANTITY_UNIT_KEYS: Record<SingleStockProduct, { quantity: string; unitCost: string; quantityUnit: string }> = {
  QUESO: { quantity: "stock.quantity", unitCost: "stock.unitCost", quantityUnit: "stock.quantityUnit" },
  YOGURT: { quantity: "stock.quantity", unitCost: "stock.unitCost", quantityUnit: "stock.quantityUnit" },
};

export function StockPurchasesSection({ purchases, product, locale }: StockPurchasesSectionProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const unitKeys = QUANTITY_UNIT_KEYS[product];
  const quantityLabel = t(unitKeys.quantity);
  const unitCostLabel = t(unitKeys.unitCost);
  const quantityUnitKey = unitKeys.quantityUnit;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>({ type: "create" });
  // Bumped on every open so the create/edit form below always gets a fresh `key` —
  // without it, reopening in the same mode twice in a row reuses the same form
  // instance. Its useActionState result stays { success: true } from the prior save,
  // and since `close` is a new function reference on every render, the form's "call
  // onSaved on success" effect re-fires on the next render and immediately closes
  // the dialog that was just reopened.
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
    <section aria-labelledby="stock-purchases-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          id="stock-purchases-heading"
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
                  <th className="px-4 py-2 font-medium">{t("stock.totalCost")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.setBy")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.date")}</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
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
                    <p className="font-medium">
                      {t(quantityUnitKey, { quantity: purchase.quantity })}
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
          {mode.type === "create" ? t("stock.newPurchase") : t("stock.editPurchase")}
        </h3>
        {mode.type === "create" ? (
          <CreateStockPurchaseForm
            key={formKey}
            product={product}
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
