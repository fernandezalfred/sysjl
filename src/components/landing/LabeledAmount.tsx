interface LabeledAmountProps {
  label: string;
  amount: string;
  // Replaces the default bold full-contrast amount style, e.g. to highlight it.
  amountClassName?: string;
  // A sign shown just before the amount, e.g. "+" on the second line of a written sum.
  prefix?: string;
}

// One "label … amount" line: the label on the left, the amount on the right with
// same-width digits, so amounts line up in a column inside every cell and card.
// Never wraps; the cell or card grows (or the fluid text shrinks) instead.
export function LabeledAmount({
  label,
  amount,
  amountClassName = "text-amount font-semibold text-foreground",
  prefix,
}: LabeledAmountProps) {
  return (
    <span className="flex items-baseline justify-between gap-3 whitespace-nowrap">
      <span>{label}</span>
      <span className="flex items-baseline gap-1.5">
        {prefix ? <span className="text-amount font-bold text-foreground/70">{prefix}</span> : null}
        <strong className={`tabular-nums ${amountClassName}`}>{amount}</strong>
      </span>
    </span>
  );
}
