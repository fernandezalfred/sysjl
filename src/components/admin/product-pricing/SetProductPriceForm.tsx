"use client";

import { useActionState } from "react";
import { setProductPrice } from "@/actions/product-prices";
import type { ActionState } from "@/types/actions";
import { PRODUCT_LABEL_KEYS } from "@/lib/money/pricing";
import { formatMonthDayYear } from "@/lib/dates";
import { FIELD_STATE_CLASS } from "@/components/sale-records/RecordFormFields";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { PricedProduct } from "@prisma/client";
import type { ProductPriceInfo } from "@/lib/money/product-prices";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";
import { useSuccessToast } from "@/hooks/useSuccessToast";

const initialState: ActionState = { success: false };

function SubmitButton({ t, pending }: { t: TranslateFn; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-10 w-full rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background shadow-sm transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
    >
      {pending ? t("adminProducts.saving") : t("adminProducts.savePrice")}
    </button>
  );
}

interface PriceFieldProps {
  id: string;
  name: string;
  label: string;
  value: number;
  // Keyed on the last save by the caller, so it shows the saved value afterwards.
  version: string;
}

// One amount in Bs, with "Bs" inside the field like the sale record form.
function PriceField({ id, name, label, value, version }: PriceFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-foreground/70">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground/50">Bs</span>
        <input
          key={version}
          id={id}
          name={name}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          defaultValue={value}
          required
          className={`w-full min-w-0 rounded-lg border border-foreground/20 bg-background py-2.5 pl-10 pr-3 text-base font-semibold tabular-nums ${FIELD_STATE_CLASS}`}
        />
      </div>
    </div>
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
  useSuccessToast(state, t("adminProducts.priceUpdated"));
  const name = t(PRODUCT_LABEL_KEYS[product]);
  // Only the fields remount on a save (new updatedAt); the form keeps its result for the toast.
  const version = String(current.updatedAt);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-base font-bold text-sky-700 dark:text-sky-300"
        >
          {name.charAt(0)}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{name}</h3>
          <p className="truncate text-xs text-foreground/60">
            {current.updatedByName
              ? t("adminProducts.setByInfo", {
                  name: current.updatedByName,
                  date: formatMonthDayYear(new Date(current.updatedAt!)),
                })
              : t("adminProducts.notSetYet")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="product" value={product} />
        <div className="grid grid-cols-2 gap-3">
          <PriceField
            id={`${product}-sale`}
            name="salePrice"
            label={t("adminProducts.salePrice")}
            value={current.salePrice}
            version={`sale-${version}`}
          />
          <PriceField
            id={`${product}-cost`}
            name="purchaseCost"
            label={t("adminProducts.purchaseCost")}
            value={current.purchaseCost}
            version={`cost-${version}`}
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {localizeError(t, state.error)}
          </p>
        ) : null}

        <div className="flex justify-end border-t border-foreground/10 pt-4">
          <SubmitButton t={t} pending={pending} />
        </div>
      </form>
    </div>
  );
}
