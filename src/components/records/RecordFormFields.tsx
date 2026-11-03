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
  };
  t: TranslateFn;
}

const inputClass = "rounded-md border border-foreground/20 bg-background px-3 py-2 text-base";
const labelClass = "text-xs font-medium text-foreground/60";

export function RecordFormFields({ defaultValues, t }: RecordFormFieldsProps) {
  // Editing keeps the record's original date; a new record is always stamped with
  // today (the browser's local day, not the user's input) — the date is never typed.
  const date = defaultValues?.date ?? todayDateString();

  // Single column always — this grid only ever renders inside a `max-w-md` dialog, so a
  // `sm:` (viewport) breakpoint would cram it to 2 narrow columns on any desktop/tablet
  // viewport regardless of the dialog's own (always-narrow) rendered width.
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex flex-col gap-1">
        <span className={labelClass}>{t("records.date")}</span>
        <p className="text-sm">{formatShortDate(date)}</p>
        {defaultValues ? null : <input type="hidden" name="date" value={date} />}
      </div>

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
