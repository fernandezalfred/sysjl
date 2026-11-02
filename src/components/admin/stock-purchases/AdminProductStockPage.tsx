import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStock } from "@/lib/stock";
import { getT } from "@/lib/i18n/server";
import { formatDateKey } from "@/lib/dates";
import { StockPurchasesSection } from "@/components/admin/stock-purchases/StockPurchasesSection";
import type { StockPurchaseRow, SingleStockProduct } from "@/types/admin";
import type { TranslateFn } from "@/lib/i18n/translations";

interface AdminProductStockPageProps {
  product: SingleStockProduct;
}

const PRODUCT_LABEL_KEYS: Record<SingleStockProduct, string> = {
  QUESO: "product.queso",
};

function productLabel(product: SingleStockProduct, t: TranslateFn): string {
  return t(PRODUCT_LABEL_KEYS[product]);
}

// Only /admin/cheese now — Yogurt has its own page/section (YogurtPurchasesSection)
// and Milk has its own too (MilkPurchasesSection), since both diverged enough
// (day-grouping, earning-vs-cost, different stat boxes) to no longer fit this
// simple shared shape.
export function AdminProductStockPage({ product }: AdminProductStockPageProps) {
  return (
    <Suspense fallback={<AdminProductStockSkeleton />}>
      <AdminProductStockContent product={product} />
    </Suspense>
  );
}

async function AdminProductStockContent({ product }: AdminProductStockPageProps) {
  await connection();

  const [currentStock, purchaseRows, { t, locale }] = await Promise.all([
    getCurrentStock(product),
    prisma.stockPurchase.findMany({
      where: { product },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    getT(),
  ]);

  const purchases: StockPurchaseRow[] = purchaseRows.map((row) => ({
    id: row.id,
    product: row.product,
    quantity: row.quantity,
    unitCost: row.unitCost,
    createdByName: row.createdBy.name,
    forUserName: null,
    createdAtFormatted: row.createdAt.toLocaleDateString("es-BO", { dateStyle: "medium" }),
    createdAtDate: formatDateKey(row.createdAt),
  }));

  const label = productLabel(product, t);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
        <p className="text-sm text-foreground/60">{t("stock.subheading", { product: label })}</p>
      </header>

      <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
          {t("stock.currentStock")}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{currentStock}</p>
      </div>

      <StockPurchasesSection purchases={purchases} product={product} locale={locale} />
    </div>
  );
}

function AdminProductStockSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading…</div>;
}
