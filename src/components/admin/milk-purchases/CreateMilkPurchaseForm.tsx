"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createStockPurchase, type ActionState } from "@/actions/stock-purchases";
import { StockPurchaseFormFields } from "@/components/admin/stock-purchases/StockPurchaseFormFields";
import type { TranslateFn } from "@/lib/i18n/translations";

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

interface CreateMilkPurchaseFormProps {
  quantityLabel: string;
  unitCostLabel: string;
  vehicleUsers: { id: string; name: string }[];
  onSaved: () => void;
  onCancel: () => void;
  t: TranslateFn;
}

export function CreateMilkPurchaseForm({
  quantityLabel,
  unitCostLabel,
  vehicleUsers,
  onSaved,
  onCancel,
  t,
}: CreateMilkPurchaseFormProps) {
  const [state, formAction] = useActionState(createStockPurchase, initialState);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="product" value="MILK" />

      <div className="flex flex-col gap-1">
        <label htmlFor="milk-for-user" className="text-xs font-medium text-foreground/60">
          {t("records.userLabel")}
        </label>
        <select
          id="milk-for-user"
          name="forUserId"
          required
          defaultValue=""
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            {t("records.selectUser")}
          </option>
          {vehicleUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

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
