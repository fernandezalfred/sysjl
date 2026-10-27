interface RecordFormFieldsProps {
  defaultValues?: {
    date: string;
    quesoTaken: number;
    quesoRemaining: number;
    yogurtTaken: number;
    yogurtRemaining: number;
  };
}

const inputClass = "rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm";
const labelClass = "text-xs font-medium text-foreground/60";

export function RecordFormFields({ defaultValues }: RecordFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="record-date" className={labelClass}>
          Date
        </label>
        <input
          id="record-date"
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date}
          className={inputClass}
        />
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
          Queso remaining
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
          Yogurt remaining
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
  );
}
