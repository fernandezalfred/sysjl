import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLandingPageData } from "@/lib/landing-data";
import { getT } from "@/lib/i18n/server";
import { defaultT, type TranslateFn } from "@/lib/i18n/translations";
import { SummaryCards } from "@/components/landing/SummaryCards";
import { SaleRecordsSection } from "@/components/landing/SaleRecordsSection";
import { AppHeader, AppHeaderSkeleton } from "@/components/layout/AppHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<DashboardSkeleton t={defaultT} />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  await connection();
  const [data, session, vehicleUsers, { t, locale }] = await Promise.all([
    getLandingPageData(),
    auth(),
    prisma.user.findMany({
      where: { role: "VEHICLE_USER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getT(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <AppHeader
        title="Dashboard"
        generatedAt={data.generatedAt}
        userName={session?.user?.name}
        isAdmin={session?.user?.role === "ADMIN"}
        isSignedIn={Boolean(session?.user?.id)}
        activePage="dashboard"
        t={t}
      />

      <SummaryCards
        productTotals={data.productTotals}
        grandTotalQuantitySold={data.grandTotalQuantitySold}
        grandTotalRevenue={data.grandTotalRevenue}
        grandTotalRemainingValue={data.grandTotalRemainingValue}
        t={t}
      />

      <SaleRecordsSection
        dailyRecords={data.dailyRecords}
        currentUserId={session?.user?.id ?? null}
        isAdmin={session?.user?.role === "ADMIN"}
        vehicleUsers={vehicleUsers}
        locale={locale}
      />
    </div>
  );
}

function DashboardSkeleton({ t }: { t: TranslateFn }) {
  return (
    <div className="flex flex-col gap-8">
      <AppHeaderSkeleton />

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
