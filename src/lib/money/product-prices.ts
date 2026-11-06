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

function findPriceRows() {
  return Promise.all(
    PRODUCTS.map((product) =>
      prisma.productPrice.findUnique({
        where: { product },
        include: { setBy: { select: { name: true } } },
      }),
    ),
  );
}

// Current sale price and purchase cost per product — one row per product, updated
// in place. The sale price falls back to the legacy hardcoded price when the admin
// hasn't set one yet (e.g. a fresh install). The purchase cost falls back to the
// product's last recorded StockPurchase cost, so Net profit keeps the cost the
// admin last entered on the old Cheese/Yogurt pages until a new one is set here.
export async function getCurrentProductPrices(): Promise<Record<PricedProduct, ProductPriceInfo>> {
  const rows = await findPriceRows();
  const costs = await Promise.all(
    PRODUCTS.map((product, i) => rows[i]?.purchaseCost ?? getLatestUnitCost(product)),
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

// Just the sale price (Bs/unit) per product, for snapshotting onto a new DailyWorkRecord.
export async function getCurrentSalePrices(): Promise<Record<PricedProduct, number>> {
  const rows = await findPriceRows();
  return {
    QUESO: rows[0]?.salePrice ?? CURRENT_UNIT_PRICE.QUESO,
    YOGURT: rows[1]?.salePrice ?? CURRENT_UNIT_PRICE.YOGURT,
  };
}

// Just the purchase cost (Bs/unit) per product, deducted per unit sold in Net profit.
export async function getCurrentPurchaseCosts(): Promise<Record<PricedProduct, number>> {
  const prices = await getCurrentProductPrices();
  return { QUESO: prices.QUESO.purchaseCost, YOGURT: prices.YOGURT.purchaseCost };
}
