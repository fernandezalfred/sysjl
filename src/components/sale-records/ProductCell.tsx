import { LabeledAmount } from "@/components/sale-records/LabeledAmount";
import { formatCurrency } from "@/lib/money/pricing";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { ProductBreakdown } from "@/types/daily-records";

interface ProductCellProps {
  breakdown: ProductBreakdown;
  t: TranslateFn;
}

// The Queso / Yogurt cell in Sale Records and Totals by User: units sold with their
// revenue, then units taken · left over with the unsold value. Sale prices and
// quantities only (no costs), so it's shown to everyone, guests included.
export function ProductCell({ breakdown, t }: ProductCellProps) {
  return (
    <>
      <div className="text-xs text-foreground/70">
        <LabeledAmount label={t("cell.soldCount", { sold: breakdown.sold })} amount={formatCurrency(breakdown.revenue)} />
      </div>
      <div className="text-xs text-foreground/70">
        <LabeledAmount
          label={t("cell.takenLeftCount", { taken: breakdown.taken, remaining: breakdown.remaining })}
          amount={formatCurrency(breakdown.remainingValue)}
        />
      </div>
    </>
  );
}
