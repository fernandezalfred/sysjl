"use client";

import { useActionState, useEffect } from "react";
import { createStockPurchase, type ActionState } from "@/actions/stock-purchases";
import { StockPurchaseFormFields } from "@/components/admin/stock-purchases/StockPurchaseFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { GrainProduct } from "@/types/admin";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";
import { useSuccessToast } from "@/hooks/useSuccessToast";

const initialState: ActionState = { success: false };

const GRAIN_OPTIONS: { value: GrainProduct; labelKey: string }[] = [
  { value: "MAIZ_PELADO", labelKey: "product.maizPelado" },
  { value: "MAIZ_CASCARA", labelKey: "product.maizCascara" },
  { value: "HABA", labelKey: "product.haba" },
];

function SubmitButton({ t, pending }: { t: TranslateFn; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? t("stock.saving") : t("stock.save")}
    </button>
  );
}

interface CreateGrainPurchaseFormProps {
  quantityLabel: string;
  unitCostLabel: string;
  onSaved: () => void;
  onCancel: () => void;
  t: TranslateFn;
}

export function CreateGrainPurchaseForm({
  quantityLabel,
  unitCostLabel,
  onSaved,
  onCancel,
  t,
}: CreateGrainPurchaseFormProps) {
  const [state, formAction, pending] = useActionState(createStockPurchase, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  useSuccessToast(state, t("toast.purchaseCreated"));

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="grain-product" className="text-xs font-medium text-foreground/70">
          {t("grains.item")}
        </label>
        <select
          id="grain-product"
          name="product"
          required
          defaultValue=""
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
        >
          <option value="" disabled>
            {t("grains.selectItem")}
          </option>
          {GRAIN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <StockPurchaseFormFields quantityLabel={quantityLabel} unitCostLabel={unitCostLabel} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {localizeError(t, state.error)}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
        >
          {t("stock.cancel")}
        </button>
        <SubmitButton t={t} pending={pending} />
      </div>
    </form>
  );
}
