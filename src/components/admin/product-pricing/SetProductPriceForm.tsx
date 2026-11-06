"use client";

import { useActionState } from "react";
import { setProductPrice, type ActionState } from "@/actions/product-prices";
import { formatCurrency, PRODUCT_LABEL_KEYS } from "@/lib/pricing";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { PricedProduct } from "@prisma/client";
import type { ProductPriceInfo } from "@/lib/product-prices";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";

const initialState: ActionState = { success: false };

function SubmitButton({ t, pending }: { t: TranslateFn; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? t("adminProducts.saving") : t("adminProducts.savePrice")}
    </button>
  );
}

interface SetProductPriceFormProps {
  product: PricedProduct;
  current: ProductPriceInfo;
  locale: Locale;
}

export function SetProductPriceForm({ product, current, locale }: SetProductPriceFormProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [state, formAction, pending] = useActionState(setProductPrice, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);

  return (
    <div className="rounded-lg border border-foreground/10 p-4">
      <h3 className="text-sm font-medium">{t(PRODUCT_LABEL_KEYS[product])}</h3>
      <p className="mt-1 text-xs text-foreground/70">
        {t("adminProducts.currentInfo", {
          sale: formatCurrency(current.salePrice),
          cost: formatCurrency(current.purchaseCost),
        })}
        {current.updatedByName
          ? t("adminProducts.setByInfo", {
              name: current.updatedByName,
              date: new Date(current.updatedAt!).toLocaleDateString("es-BO"),
            })
          : t("adminProducts.notSetYet")}
      </p>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="product" value={product} />
        <div className="flex flex-col gap-1">
          <label htmlFor={`${product}-sale`} className="text-xs font-medium text-foreground/70">
            {t("adminProducts.salePriceBs")}
          </label>
          <input
            id={`${product}-sale`}
            name="salePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={current.salePrice}
            required
            className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${product}-cost`} className="text-xs font-medium text-foreground/70">
            {t("adminProducts.purchaseCostBs")}
          </label>
          <input
            id={`${product}-cost`}
            name="purchaseCost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={current.purchaseCost}
            required
            className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {localizeError(t, state.error)}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-green-600 dark:text-green-400">{t("adminProducts.priceUpdated")}</p>
        ) : null}

        <div>
          <SubmitButton t={t} pending={pending} />
        </div>
      </form>
    </div>
  );
}
