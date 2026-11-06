import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProductPrices } from "@/lib/product-prices";
import { getT } from "@/lib/i18n/server";
import { formatBusinessDateKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/pricing";
import { YogurtPurchasesSection } from "@/components/admin/yogurt-purchases/YogurtPurchasesSection";
import { SetProductPriceForm } from "@/components/admin/product-pricing/SetProductPriceForm";
import type { StockPurchaseRow } from "@/types/admin";

export default function AdminYogurtPage() {
  return (
    <Suspense fallback={<AdminYogurtSkeleton />}>
      <AdminYogurtContent />
    </Suspense>
  );
}

async function AdminYogurtContent() {
  await connection();

  const [purchaseRows, prices, { t, locale }] = await Promise.all([
    prisma.stockPurchase.findMany({
      where: { product: "YOGURT" },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    getCurrentProductPrices(),
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
    createdAtDate: formatBusinessDateKey(row.createdAt),
  }));

  const salePrice = prices.YOGURT.salePrice;
  // Current deposit stock is no longer shown here — replaced by the cost of the
  // most recent purchase (purchases[0], since the list is sorted createdAt desc).
  const lastPurchase = purchases[0];
  const lastPurchaseTotalCost = lastPurchase ? lastPurchase.quantity * lastPurchase.unitCost : null;

  const label = t("product.yogurt");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
        <p className="text-sm text-foreground/60">{t("stock.subheading", { product: label })}</p>
      </header>

      {lastPurchaseTotalCost !== null ? (
        <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            {t("stock.totalCost")}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {formatCurrency(lastPurchaseTotalCost)}
          </p>
        </div>
      ) : null}

      <SetProductPriceForm
        key={`YOGURT-${prices.YOGURT.updatedAt}`}
        product="YOGURT"
        current={prices.YOGURT}
        locale={locale}
      />

      <YogurtPurchasesSection purchases={purchases} salePrice={salePrice} locale={locale} />
    </div>
  );
}

function AdminYogurtSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading…</div>;
}
