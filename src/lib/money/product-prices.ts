import { prisma } from "@/lib/prisma";
import { CURRENT_UNIT_PRICE } from "@/lib/money/pricing";
import { getLatestUnitCost } from "@/lib/money/stock";
import { PricedProduct } from "@prisma/client";

const PRODUCTS: PricedProduct[] = [PricedProduct.QUESO, PricedProduct.YOGURT];

export interface ProductPriceInfo {
  product: PricedProduct;
  salePrice: number;
  purchaseCost: number;
  updatedAt: string | null;
  updatedByName: string | null;
}

function findPriceRows(companyId: string) {
  return Promise.all(
    PRODUCTS.map((product) =>
      prisma.productPrice.findUnique({
        where: { companyId_product: { companyId, product } },
        include: { setBy: { select: { name: true } } },
      }),
    ),
  );
}

// A company's current sale price and purchase cost per product — one row per product, updated
// in place. The sale price falls back to the legacy hardcoded price when the admin
// hasn't set one yet (e.g. a fresh install). The purchase cost falls back to the
// product's last recorded StockPurchase cost, so Net profit keeps the cost the
// admin last entered on the old Cheese/Yogurt pages until a new one is set here.
export async function getCurrentProductPrices(companyId: string): Promise<Record<PricedProduct, ProductPriceInfo>> {
  const rows = await findPriceRows(companyId);
  const costs = await Promise.all(
    PRODUCTS.map((product, i) => rows[i]?.purchaseCost ?? getLatestUnitCost(product, companyId)),
  );

  const result = {} as Record<PricedProduct, ProductPriceInfo>;
  PRODUCTS.forEach((product, i) => {
    const row = rows[i];
    result[product] = {
      product,
      salePrice: row?.salePrice ?? CURRENT_UNIT_PRICE[product],
      purchaseCost: costs[i],
      updatedAt: row ? row.updatedAt.toISOString() : null,
      updatedByName: row ? row.setBy.name : null,
    };
  });
  return result;
}

// Just the purchase cost (Bs/unit) per product, deducted per unit sold in Net profit.
export async function getCurrentPurchaseCosts(companyId: string): Promise<Record<PricedProduct, number>> {
  const prices = await getCurrentProductPrices(companyId);
  return { QUESO: prices.QUESO.purchaseCost, YOGURT: prices.YOGURT.purchaseCost };
}
