import { prisma } from "@/lib/prisma";
import { getCurrentStock } from "@/lib/stock";
import { PRODUCT_LABELS } from "@/lib/pricing";
import type { ProductCode } from "@/types/landing";

const TRACKED_PRODUCTS: ProductCode[] = ["QUESO", "YOGURT"];

export interface ProductInvestmentSummary {
  product: ProductCode;
  label: string;
  investment: number;
  sold: number;
  left: number;
}

// investment.ts has no access to sale-price history, so revenue is merged in by the
// caller from `ProductTotal.revenue` (already correctly computed from each record's
// own snapshotted price in buildProductTotals) rather than recomputed here.
export interface ProductInvestmentDetail extends ProductInvestmentSummary {
  revenue: number;
}

// All-time, per-product investment/sold/left. Scoped to Queso and Yogurt: Milk has
// purchase data but no quantity-level sales tracking, and Mote has no data source at
// all (see context/current-feature.md). Admin-only — investment is cost data.
export async function getProductInvestmentSummaries(): Promise<ProductInvestmentSummary[]> {
  return Promise.all(
    TRACKED_PRODUCTS.map(async (product) => {
      const [purchases, workRecordTotals, left] = await Promise.all([
        prisma.stockPurchase.findMany({
          where: { product },
          select: { quantity: true, unitCost: true },
        }),
        prisma.dailyWorkRecord.aggregate({
          _sum: { quesoTaken: true, quesoRemaining: true, yogurtTaken: true, yogurtRemaining: true },
        }),
        getCurrentStock(product),
      ]);

      const investment = purchases.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
      const taken =
        (product === "QUESO" ? workRecordTotals._sum.quesoTaken : workRecordTotals._sum.yogurtTaken) ?? 0;
      const remaining =
        (product === "QUESO" ? workRecordTotals._sum.quesoRemaining : workRecordTotals._sum.yogurtRemaining) ?? 0;
      const sold = taken - remaining;

      return { product, label: PRODUCT_LABELS[product], investment, sold, left };
    }),
  );
}
