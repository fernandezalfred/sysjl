import { formatShortDate, todayDateString } from "@/lib/dates";
import type { TranslateFn } from "@/lib/i18n/translations";

interface RecordFormFieldsProps {
  defaultValues?: {
    date: string;
    quesoTaken: number;
    quesoRemaining: number;
    yogurtTaken: number;
    yogurtRemaining: number;
    totalSold: number;
    milkLiters: number;
    milkUnitCost: number;
  };
  t: TranslateFn;
}

const inputClass = "w-full min-w-0 rounded-md border border-foreground/20 bg-background px-3 py-2 text-base";
// Usual purchase price of Milk; prefilled on a new record, the seller can change it.
const DEFAULT_MILK_UNIT_COST = 7;
const labelClass = "text-xs font-medium text-foreground/70";

export function RecordFormFields({ defaultValues, t }: RecordFormFieldsProps) {
  // Editing keeps the record's original date; a new record is always stamped with
  // today (the browser's local day, not the user's input) — the date is never typed.
  const date = defaultValues?.date ?? todayDateString();

  // Each product's taken and left share one row (always two columns, not a viewport
  // breakpoint — this only ever renders inside a narrow `max-w-md` dialog).
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex flex-col gap-1">
        <span className={labelClass}>{t("records.date")}</span>
        <p className="text-sm">{formatShortDate(date)}</p>
        {defaultValues ? null : <input type="hidden" name="date" value={date} />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="queso-taken" className={labelClass}>
            {t("records.quesoTaken")}
          </label>
          <input
            id="queso-taken"
            name="quesoTaken"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.quesoTaken}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="queso-remaining" className={labelClass}>
            {t("records.quesoLeft")}
          </label>
          <input
            id="queso-remaining"
            name="quesoRemaining"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.quesoRemaining}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="yogurt-taken" className={labelClass}>
            {t("records.yogurtTaken")}
          </label>
          <input
            id="yogurt-taken"
            name="yogurtTaken"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.yogurtTaken}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="yogurt-remaining" className={labelClass}>
            {t("records.yogurtLeft")}
          </label>
          <input
            id="yogurt-remaining"
            name="yogurtRemaining"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.yogurtRemaining}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="milk-liters" className={labelClass}>
            {t("records.milkLiters")}
          </label>
          <input
            id="milk-liters"
            name="milkLiters"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.milkLiters}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="milk-unit-cost" className={labelClass}>
            {t("records.milkUnitCost")}
          </label>
          <input
            id="milk-unit-cost"
            name="milkUnitCost"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={defaultValues?.milkUnitCost ?? DEFAULT_MILK_UNIT_COST}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="total-sold" className={labelClass}>
          {t("records.totalSold")}
        </label>
        <input
          id="total-sold"
          name="totalSold"
          type="number"
          min={0}
          required
          defaultValue={defaultValues?.totalSold}
          className={inputClass}
        />
      </div>
    </div>
  );
}
