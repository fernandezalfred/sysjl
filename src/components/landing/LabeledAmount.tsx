interface LabeledAmountProps {
  label: string;
  amount: string;
}

// A "Label: amount" line where the amount is bold and full-contrast so it
// stands out from its label, even inside muted secondary text.
export function LabeledAmount({ label, amount }: LabeledAmountProps) {
  return (
    <>
      {label}: <strong className="font-semibold text-foreground">{amount}</strong>
    </>
  );
}
