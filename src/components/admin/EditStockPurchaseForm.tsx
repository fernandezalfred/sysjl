"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteStockPurchase,
  updateStockPurchase,
  type ActionState,
} from "@/actions/stock-purchases";
import { StockPurchaseFormFields } from "@/components/admin/StockPurchaseFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { StockPurchaseRow } from "@/types/admin";

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
  const [state, formAction] = useActionState(updateStockPurchase, initialState);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  async function handleDelete() {
    if (!window.confirm(t("stock.confirmDelete"))) return;

    setIsDeleting(true);
    setDeleteError(undefined);
    const result = await deleteStockPurchase(purchase.id);
    if (result.success) {
      onSaved();
      return;
    }
    setDeleteError(result.error);
    setIsDeleting(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="purchaseId" value={purchase.id} />
      <StockPurchaseFormFields defaultValues={purchase} quantityLabel={quantityLabel} unitCostLabel={unitCostLabel} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      {deleteError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {deleteError}
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
          <SubmitButton t={t} />
        </div>
      </div>
    </form>
  );
}
