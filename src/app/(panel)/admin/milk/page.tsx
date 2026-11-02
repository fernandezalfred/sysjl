import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { formatDateKey } from "@/lib/dates";
import { MilkPurchasesSection } from "@/components/admin/milk-purchases/MilkPurchasesSection";
import type { StockPurchaseRow } from "@/types/admin";

export default function AdminMilkPage() {
  return (
    <Suspense fallback={<AdminMilkSkeleton />}>
      <AdminMilkContent />
    </Suspense>
  );
}

async function AdminMilkContent() {
  await connection();

  const [purchaseRows, vehicleUsers, { t, locale }] = await Promise.all([
    prisma.stockPurchase.findMany({
      where: { product: "MILK" },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        forUser: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "VEHICLE_USER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getT(),
  ]);

  const purchases: StockPurchaseRow[] = purchaseRows.map((row) => ({
    id: row.id,
    product: row.product,
    quantity: row.quantity,
    unitCost: row.unitCost,
    createdByName: row.createdBy.name,
    forUserName: row.forUser?.name ?? null,
    createdAtFormatted: row.createdAt.toLocaleDateString("es-BO", { dateStyle: "medium" }),
    createdAtDate: formatDateKey(row.createdAt),
  }));

  const label = t("product.milk");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
        <p className="text-sm text-foreground/60">{t("stock.subheadingPurchaseOnly", { product: label })}</p>
      </header>

      <MilkPurchasesSection purchases={purchases} vehicleUsers={vehicleUsers} locale={locale} />
    </div>
  );
}

function AdminMilkSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading…</div>;
}
