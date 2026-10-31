"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createStockPurchase, type ActionState } from "@/actions/stock-purchases";
import { StockPurchaseFormFields } from "@/components/admin/stock-purchases/StockPurchaseFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { SingleStockProduct } from "@/types/admin";

const initialState: ActionState = { success: false };

function SubmitButton({ t }: { t: TranslateFn }) {
  const { pending } = useFormStatus();
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

interface CreateStockPurchaseFormProps {
  product: SingleStockProduct;
  quantityLabel: string;
  unitCostLabel: string;
  onSaved: () => void;
  onCancel: () => void;
  t: TranslateFn;
}

export function CreateStockPurchaseForm({
  product,
  quantityLabel,
  unitCostLabel,
  onSaved,
  onCancel,
  t,
}: CreateStockPurchaseFormProps) {
  const [state, formAction] = useActionState(createStockPurchase, initialState);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="product" value={product} />
      <StockPurchaseFormFields quantityLabel={quantityLabel} unitCostLabel={unitCostLabel} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
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
        <SubmitButton t={t} />
      </div>
    </form>
  );
}
