import { prisma } from "@/lib/prisma";
import { CURRENT_UNIT_PRICE } from "@/lib/pricing";
import type { ProductCode } from "@/types/landing";

const PRODUCTS: ProductCode[] = ["QUESO", "YOGURT"];

export interface ProductPriceInfo {
  product: ProductCode;
  purchasePrice: number;
  salePrice: number;
  updatedAt: string | null;
  updatedByName: string | null;
}

// Current price per product: the latest ProductPrice row (by createdAt). Falls back
// to the legacy hardcoded sale price, with no purchase price, when the admin hasn't
// set one yet — e.g. a fresh install before the first price is entered.
export async function getCurrentProductPrices(): Promise<Record<ProductCode, ProductPriceInfo>> {
  const rows = await Promise.all(
    PRODUCTS.map((product) =>
      prisma.productPrice.findFirst({
        where: { product },
        orderBy: { createdAt: "desc" },
        include: { setBy: { select: { name: true } } },
      }),
    ),
  );

  const result = {} as Record<ProductCode, ProductPriceInfo>;
  PRODUCTS.forEach((product, i) => {
    const row = rows[i];
    result[product] = row
      ? {
          product,
          purchasePrice: row.purchasePrice,
          salePrice: row.salePrice,
          updatedAt: row.createdAt.toISOString(),
          updatedByName: row.setBy.name,
        }
      : {
          product,
          purchasePrice: 0,
          salePrice: CURRENT_UNIT_PRICE[product],
          updatedAt: null,
          updatedByName: null,
        };
  });
  return result;
}

// Just the sale price (Bs/unit) per product, for snapshotting onto a new DailyWorkRecord.
export async function getCurrentSalePrices(): Promise<Record<ProductCode, number>> {
  const prices = await getCurrentProductPrices();
  return { QUESO: prices.QUESO.salePrice, YOGURT: prices.YOGURT.salePrice };
}
