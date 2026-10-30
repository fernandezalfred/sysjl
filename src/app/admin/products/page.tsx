import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProductPrices } from "@/lib/product-prices";
import { PRODUCT_LABELS, formatCurrency } from "@/lib/pricing";
import { SetProductPriceForm } from "@/components/admin/SetProductPriceForm";
import { getT } from "@/lib/i18n/server";
import type { ProductPriceHistoryRow } from "@/types/admin";

export default function AdminProductsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<AdminProductsSkeleton />}>
        <AdminProductsContent />
      </Suspense>
    </div>
  );
}

async function AdminProductsContent() {
  await connection();

  const [prices, historyRows, { t, locale }] = await Promise.all([
    getCurrentProductPrices(),
    prisma.productPrice.findMany({
      orderBy: { createdAt: "desc" },
      include: { setBy: { select: { name: true } } },
    }),
    getT(),
  ]);

  const history: ProductPriceHistoryRow[] = historyRows.map((row) => ({
    id: row.id,
    product: row.product,
    purchasePrice: row.purchasePrice,
    salePrice: row.salePrice,
    setByName: row.setBy.name,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/" className="text-sm text-foreground/60 underline hover:text-foreground">
          {t("adminProducts.backToDashboard")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("adminProducts.heading")}</h1>
        <p className="text-sm text-foreground/60">{t("adminProducts.subheading")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SetProductPriceForm
          key={`QUESO-${prices.QUESO.updatedAt}`}
          product="QUESO"
          current={prices.QUESO}
          locale={locale}
        />
        <SetProductPriceForm
          key={`YOGURT-${prices.YOGURT.updatedAt}`}
          product="YOGURT"
          current={prices.YOGURT}
          locale={locale}
        />
      </div>

      <section aria-labelledby="price-history-heading" className="flex flex-col gap-3">
        <h2
          id="price-history-heading"
          className="text-sm font-medium uppercase tracking-wide text-foreground/60"
        >
          {t("adminProducts.priceHistory")}
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-foreground/60">{t("adminProducts.noHistory")}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-foreground/10">
            <table className="w-full text-sm">
              <thead className="bg-foreground/[0.03] text-left text-foreground/60">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.product")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.purchasePrice")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.salePrice")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.setBy")}</th>
                  <th className="px-4 py-2 font-medium">{t("adminProducts.date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {history.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2 font-medium">{PRODUCT_LABELS[row.product]}</td>
                    <td className="px-4 py-2">{formatCurrency(row.purchasePrice)}</td>
                    <td className="px-4 py-2">{formatCurrency(row.salePrice)}</td>
                    <td className="px-4 py-2">{row.setByName}</td>
                    <td className="px-4 py-2">
                      {new Date(row.createdAt).toLocaleString("es-BO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AdminProductsSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading product prices…</div>;
}
