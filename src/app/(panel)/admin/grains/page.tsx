import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { GrainPurchasesSection } from "@/components/admin/grain-purchases/GrainPurchasesSection";
import type { GrainProduct, StockPurchaseRow } from "@/types/admin";

const GRAIN_PRODUCTS: GrainProduct[] = ["MAIZ_PELADO", "MAIZ_CASCARA", "HABA"];

export default function AdminGrainsPage() {
  return (
    <Suspense fallback={<AdminGrainsSkeleton />}>
      <AdminGrainsContent />
    </Suspense>
  );
}

async function AdminGrainsContent() {
  await connection();

  const [purchaseRows, { t, locale }] = await Promise.all([
    prisma.stockPurchase.findMany({
      where: { product: { in: GRAIN_PRODUCTS } },
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
    createdAtFormatted: row.createdAt.toLocaleDateString("es-BO", { dateStyle: "medium" }),
  }));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("grains.heading")}</h1>
        <p className="text-sm text-foreground/60">{t("grains.subheading")}</p>
      </header>

      <GrainPurchasesSection purchases={purchases} locale={locale} />
    </div>
  );
}

function AdminGrainsSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading…</div>;
}
