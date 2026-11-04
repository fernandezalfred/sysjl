import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLandingPageData } from "@/lib/landing-data";
import { getNetProfitInputs } from "@/lib/net-profit";
import { buildSalesChartsData } from "@/lib/sales-charts";
import { getCurrentProductPrices } from "@/lib/product-prices";
import { getT } from "@/lib/i18n/server";
import { defaultT, type TranslateFn } from "@/lib/i18n/translations";
import { SaleRecordsSection } from "@/components/landing/SaleRecordsSection";
import { SalesChartsSection } from "@/components/sales-charts/SalesChartsSection";
import { SetProductPriceForm } from "@/components/admin/product-pricing/SetProductPriceForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton t={defaultT} />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();
  const [data, session, activeUsers, { t, locale }] = await Promise.all([
    getLandingPageData(),
    auth(),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getT(),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";
  // Earned (profit) is cost/financial data per project-overview.md §3 — admin-only,
  // so the cost lookup and its use below are both gated on isAdmin.
  const [prices, netProfitInputs] = isAdmin
    ? await Promise.all([getCurrentProductPrices(), getNetProfitInputs(data.dailyRecords)])
    : [null, null];

  const unitCosts = netProfitInputs?.unitCosts ?? null;
  const deductions = netProfitInputs?.deductions ?? null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("header.dashboard")}</h1>
        <p className="text-sm text-foreground/60">
          {t("header.updated")}{" "}
          {new Date(data.generatedAt).toLocaleString("es-BO", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </header>

      <SalesChartsSection {...buildSalesChartsData(data.dailyRecords)} t={t} locale={locale} />

      {isAdmin && prices ? (
        <section aria-labelledby="sale-prices-heading" className="flex flex-col gap-3">
          <h2
            id="sale-prices-heading"
            className="text-sm font-medium uppercase tracking-wide text-foreground/60"
          >
            {t("adminProducts.heading")}
          </h2>
          <p className="text-sm text-foreground/60">{t("adminProducts.subheading")}</p>
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
        </section>
      ) : null}

      <SaleRecordsSection
        dailyRecords={data.dailyRecords}
        currentUserId={session?.user?.id ?? null}
        currentUserName={session?.user?.name ?? null}
        isAdmin={isAdmin}
        activeUsers={activeUsers}
        locale={locale}
        unitCosts={unitCosts}
        deductions={deductions}
      />
    </div>
  );
}

function DashboardSkeleton({ t }: { t: TranslateFn }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <TableSkeleton rows={2} t={t} />
      </div>
    </div>
  );
}
