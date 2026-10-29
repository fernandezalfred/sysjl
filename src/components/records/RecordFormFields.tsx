import { formatShortDate, todayDateString } from "@/lib/dates";

interface RecordFormFieldsProps {
  defaultValues?: {
    date: string;
    quesoTaken: number;
    quesoRemaining: number;
    yogurtTaken: number;
    yogurtRemaining: number;
    totalSold: number;
  };
}

const inputClass = "rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm";
const labelClass = "text-xs font-medium text-foreground/60";

export function RecordFormFields({ defaultValues }: RecordFormFieldsProps) {
  // Editing keeps the record's original date; a new record is always stamped with
  // today (the browser's local day, not the user's input) — the date is never typed.
  const date = defaultValues?.date ?? todayDateString();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Date</span>
        <p className="text-sm">{formatShortDate(date)}</p>
        {defaultValues ? null : <input type="hidden" name="date" value={date} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="queso-taken" className={labelClass}>
          Queso taken
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
          Queso left
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
          Yogurt taken
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
          Yogurt left
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

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="total-sold" className={labelClass}>
          Total sold
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
