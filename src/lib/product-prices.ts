import { prisma } from "@/lib/prisma";
import { CURRENT_UNIT_PRICE } from "@/lib/pricing";
import { PricedProduct } from "@prisma/client";

const PRODUCTS: PricedProduct[] = [PricedProduct.QUESO, PricedProduct.YOGURT];

export interface ProductPriceInfo {
  product: PricedProduct;
  salePrice: number;
  updatedAt: string | null;
  updatedByName: string | null;
}

// Current sale price per product — one row per product, updated in place. Falls
// back to the legacy hardcoded price when the admin hasn't set one yet — e.g. a
// fresh install before the first price is entered.
export async function getCurrentProductPrices(): Promise<Record<PricedProduct, ProductPriceInfo>> {
  const rows = await Promise.all(
    PRODUCTS.map((product) =>
      prisma.productPrice.findUnique({
        where: { product },
        include: { setBy: { select: { name: true } } },
      }),
    ),
  );

  const result = {} as Record<PricedProduct, ProductPriceInfo>;
  PRODUCTS.forEach((product, i) => {
    const row = rows[i];
    result[product] = row
      ? {
          product,
          salePrice: row.salePrice,
          updatedAt: row.updatedAt.toISOString(),
          updatedByName: row.setBy.name,
        }
      : {
          product,
          salePrice: CURRENT_UNIT_PRICE[product],
          updatedAt: null,
          updatedByName: null,
        };
  });
  return result;
}

// Just the sale price (Bs/unit) per product, for snapshotting onto a new DailyWorkRecord.
export async function getCurrentSalePrices(): Promise<Record<PricedProduct, number>> {
  const prices = await getCurrentProductPrices();
  return { QUESO: prices.QUESO.salePrice, YOGURT: prices.YOGURT.salePrice };
}
