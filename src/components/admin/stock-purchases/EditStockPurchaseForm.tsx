"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteStockPurchase,
  updateStockPurchase,
  type ActionState,
} from "@/actions/stock-purchases";
import { StockPurchaseFormFields } from "@/components/admin/stock-purchases/StockPurchaseFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { StockPurchaseRow } from "@/types/admin";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";
import { useSuccessToast } from "@/hooks/useSuccessToast";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";

const initialState: ActionState = { success: false };

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

interface EditStockPurchaseFormProps {
  purchase: StockPurchaseRow;
  quantityLabel: string;
  unitCostLabel: string;
  onSaved: () => void;
  onCancel: () => void;
  t: TranslateFn;
}

export function EditStockPurchaseForm({
  purchase,
  quantityLabel,
  unitCostLabel,
  onSaved,
  onCancel,
  t,
}: EditStockPurchaseFormProps) {
  const [state, formAction, pending] = useActionState(updateStockPurchase, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  useSuccessToast(state, t("toast.purchaseUpdated"));
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  async function handleDelete() {
    if (!(await confirmAlert(t, t("stock.confirmDelete"), { danger: true }))) return;

    setIsDeleting(true);
    const result = await deleteStockPurchase(purchase.id);
    if (result.success) {
      successToast(t("toast.purchaseDeleted"));
      onSaved();
      return;
    }
    errorAlert(t, localizeError(t, result.error ?? ""));
    setIsDeleting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="purchaseId" value={purchase.id} />
      <StockPurchaseFormFields defaultValues={purchase} quantityLabel={quantityLabel} unitCostLabel={unitCostLabel} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {localizeError(t, state.error)}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
        >
          {isDeleting ? t("stock.deleting") : t("stock.delete")}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
          >
            {t("stock.cancel")}
          </button>
          <SubmitButton t={t} pending={pending} />
        </div>
      </div>
    </form>
  );
}
