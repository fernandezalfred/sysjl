import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLandingPageData } from "@/lib/landing-data";
import { buildAdjustedRevenueTotal, type MilkGrainsDeductions } from "@/lib/revenue";
import { getCurrentProductPrices } from "@/lib/product-prices";
import { getProductInvestmentSummaries } from "@/lib/investment";
import { getCurrentStock, getLatestUnitCost, getLatestMilkCostByUser, getGrainsCostByDay } from "@/lib/stock";
import { getT } from "@/lib/i18n/server";
import { defaultT, type TranslateFn } from "@/lib/i18n/translations";
import { SummaryCards } from "@/components/landing/SummaryCards";
import { SaleRecordsSection } from "@/components/landing/SaleRecordsSection";
import { ProductInvestmentSection } from "@/components/landing/ProductInvestmentSection";
import { SaleRecordsTrendSection } from "@/components/landing/SaleRecordsTrendSection";
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
  const [data, session, vehicleUsers, { t, locale }, quesoStock, yogurtStock] = await Promise.all([
    getLandingPageData(),
    auth(),
    prisma.user.findMany({
      where: { role: "VEHICLE_USER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getT(),
    getCurrentStock("QUESO"),
    getCurrentStock("YOGURT"),
  ]);

  // Current deposit stock (purchased minus sold, all-time) — not the same thing as
  // each record's own "remaining" quantity summed, which only reflects what was left
  // in vehicles at each day's end and isn't the actual stock figure. Must match
  // /admin/cheese and /admin/yogurt, which already compute it this way.
  const currentStock: Record<"QUESO" | "YOGURT", number> = { QUESO: quesoStock, YOGURT: yogurtStock };

  const isAdmin = session?.user?.role === "ADMIN";
  // Earned (profit) is cost/financial data per project-overview.md §3 — admin-only,
  // so the cost lookup and its use below are both gated on isAdmin.
  const [prices, investmentSummaries, quesoCost, yogurtCost, milkCostByUserId, grainsCostByDay] = isAdmin
    ? await Promise.all([
        getCurrentProductPrices(),
        getProductInvestmentSummaries(),
        getLatestUnitCost("QUESO"),
        getLatestUnitCost("YOGURT"),
        getLatestMilkCostByUser(vehicleUsers.map((u) => u.id)),
        getGrainsCostByDay(),
      ])
    : [null, null, null, null, null, null];

  const unitCosts =
    quesoCost !== null && yogurtCost !== null ? { QUESO: quesoCost, YOGURT: yogurtCost } : null;

  // Grains cost is tracked per purchase day, not per driver — split evenly across
  // however many drivers actually have a work record that same day, so the full
  // day's grains cost isn't deducted multiple times when several drivers worked it.
  const deductions: MilkGrainsDeductions | null =
    milkCostByUserId && grainsCostByDay
      ? (() => {
          const recordCountByDate = new Map<string, number>();
          for (const r of data.dailyRecords) {
            recordCountByDate.set(r.date, (recordCountByDate.get(r.date) ?? 0) + 1);
          }
          const grainsShareByDate: Record<string, number> = {};
          for (const [date, total] of Object.entries(grainsCostByDay)) {
            grainsShareByDate[date] = total / (recordCountByDate.get(date) ?? 1);
          }
          return { milkCostByUserId, grainsShareByDate };
        })()
      : null;

  // Revenue isn't computed in investment.ts (no access to per-record sale-price
  // history there) — merged in here from the already-computed, price-correct
  // `ProductTotal.revenue`.
  const investmentDetails = investmentSummaries?.map((summary) => ({
    ...summary,
    revenue: data.productTotals.find((p) => p.product === summary.product)?.revenue ?? 0,
  }));

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

      <SummaryCards productTotals={data.productTotals} currentStock={currentStock} t={t} />

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

      {isAdmin && investmentDetails ? (
        <ProductInvestmentSection details={investmentDetails} t={t} locale={locale} />
      ) : null}

      {isAdmin && unitCosts ? (
        <SaleRecordsTrendSection
          items={data.dailyRecords.map((r) => ({ date: r.date, value: r.totalSold }))}
          adjustedRevenueTotal={buildAdjustedRevenueTotal(data.dailyRecords, unitCosts, deductions ?? undefined)}
          t={t}
          locale={locale}
        />
      ) : null}

      <SaleRecordsSection
        dailyRecords={data.dailyRecords}
        currentUserId={session?.user?.id ?? null}
        isAdmin={isAdmin}
        vehicleUsers={vehicleUsers}
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
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="mt-4 h-4 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <TableSkeleton rows={2} t={t} />
      </div>
    </div>
  );
}
