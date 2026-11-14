import { todayDateString } from "@/lib/dates";

interface StockPurchaseFormFieldsProps {
  defaultValues?: {
    quantity: number;
    unitCost: number;
  };
  quantityLabel: string;
  unitCostLabel: string;
  // Editing only: the purchase's day (YYYY-MM-DD) and its label. Without it there's
  // no date field (a new purchase is always today).
  date?: { value: string; label: string };
}

const inputClass = "rounded-md border border-foreground/20 bg-background px-3 py-2 text-base";
const labelClass = "text-xs font-medium text-foreground/70";

export function StockPurchaseFormFields({
  defaultValues,
  quantityLabel,
  unitCostLabel,
  date,
}: StockPurchaseFormFieldsProps) {
  // Single column always — see RecordFormFields.tsx for why (same fixed-width dialog).
  return (
    <div className="grid grid-cols-1 gap-3">
      {date ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="stock-date" className={labelClass}>
            {date.label}
          </label>
          <input
            id="stock-date"
            name="date"
            type="date"
            max={todayDateString()}
            required
            defaultValue={date.value}
            className={inputClass}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="stock-quantity" className={labelClass}>
          {quantityLabel}
        </label>
        <input
          id="stock-quantity"
          name="quantity"
          type="number"
          min={1}
          required
          defaultValue={defaultValues?.quantity}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="stock-unit-cost" className={labelClass}>
          {unitCostLabel}
        </label>
        <input
          id="stock-unit-cost"
          name="unitCost"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={defaultValues?.unitCost}
          className={inputClass}
        />
      </div>
    </div>
  );
}
