import type { ReactNode } from "react";
import { formatShortDate, todayDateString } from "@/lib/dates";
import type { DictionaryKey, TranslateFn } from "@/lib/i18n/translations";

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

// Usual purchase price of Milk; prefilled on a new record, the seller can change it.
const DEFAULT_MILK_UNIT_COST = 7;
const inputClass =
  "w-full min-w-0 rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base tabular-nums focus:border-foreground/50 focus:outline-none";
const labelClass = "text-xs font-medium text-foreground/70";

interface NumberFieldProps {
  id: string;
  name: string;
  label: DictionaryKey;
  defaultValue?: number;
  decimal?: boolean;
  t: TranslateFn;
}

function NumberField({ id, name, label, defaultValue, decimal, t }: NumberFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className={labelClass}>
        {t(label)}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode={decimal ? "decimal" : "numeric"}
        min={0}
        step={decimal ? "0.01" : undefined}
        required
        defaultValue={defaultValue}
        className={inputClass}
      />
    </div>
  );
}

// One product's pair of fields under its name, so each label stays short ("Sacó",
// "Sobró") and fits two columns on a phone; the fieldset's legend gives screen
// readers the product.
function FieldGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-3 pb-3 pt-2">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        {hint ? <span className="text-xs text-foreground/50">{hint}</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </fieldset>
  );
}

export function RecordFormFields({ defaultValues, t }: RecordFormFieldsProps) {
  // Editing keeps the record's original date; a new record is always stamped with
  // today (the browser's local day, not the user's input) — the date is never typed.
  const date = defaultValues?.date ?? todayDateString();
  const units = t("records.units");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-foreground/5 px-3 py-2">
        <span className={labelClass}>{t("records.date")}</span>
        <span className="text-sm font-medium">{formatShortDate(date, t)}</span>
        {defaultValues ? null : <input type="hidden" name="date" value={date} />}
      </div>

      <FieldGroup title={t("product.queso")} hint={units}>
        <NumberField id="queso-taken" name="quesoTaken" label="records.taken" defaultValue={defaultValues?.quesoTaken} t={t} />
        <NumberField id="queso-remaining" name="quesoRemaining" label="records.left" defaultValue={defaultValues?.quesoRemaining} t={t} />
      </FieldGroup>

      <FieldGroup title={t("product.yogurt")} hint={units}>
        <NumberField id="yogurt-taken" name="yogurtTaken" label="records.taken" defaultValue={defaultValues?.yogurtTaken} t={t} />
        <NumberField id="yogurt-remaining" name="yogurtRemaining" label="records.left" defaultValue={defaultValues?.yogurtRemaining} t={t} />
      </FieldGroup>

      <FieldGroup title={t("records.milk")}>
        <NumberField id="milk-liters" name="milkLiters" label="records.milkLiters" defaultValue={defaultValues?.milkLiters} t={t} />
        <NumberField
          id="milk-unit-cost"
          name="milkUnitCost"
          label="records.milkUnitCost"
          defaultValue={defaultValues?.milkUnitCost ?? DEFAULT_MILK_UNIT_COST}
          decimal
          t={t}
        />
      </FieldGroup>

      <div className="flex flex-col gap-1 rounded-xl border border-foreground/20 px-3 pb-3 pt-2">
        <label htmlFor="total-sold" className="text-sm font-semibold">
          {t("records.totalSold")}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground/50">Bs</span>
          <input
            id="total-sold"
            name="totalSold"
            type="number"
            inputMode="numeric"
            min={0}
            required
            defaultValue={defaultValues?.totalSold}
            className={`${inputClass} pl-10 text-lg font-semibold`}
          />
        </div>
      </div>
    </div>
  );
}
