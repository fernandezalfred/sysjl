import { LabeledAmount } from "@/components/landing/LabeledAmount";
import { formatCurrency } from "@/lib/pricing";
import { sellerPay } from "@/lib/seller-pay";
import type { TranslateFn } from "@/lib/i18n/translations";

interface SellerPayLineProps {
  // The record's Total venta (sold revenue), which seller pay is computed from.
  totalSold: number;
  t: TranslateFn;
}

// "Pago" / "Pay" (seller pay) under the seller's name in Sale Records and Totals by User.
// Callers show it to admins on every row and to a seller on their own rows only.
export function SellerPayLine({ totalSold, t }: SellerPayLineProps) {
  return (
    <div className="text-xs font-normal text-foreground/70">
      <LabeledAmount label={t("cell.pay")} amount={formatCurrency(sellerPay(totalSold))} />
    </div>
  );
}
