import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLandingPageData } from "@/lib/landing-data";
import { getT } from "@/lib/i18n/server";
import { defaultT, type TranslateFn } from "@/lib/i18n/translations";
import { SummaryCards } from "@/components/landing/SummaryCards";
import { SaleRecordsSection } from "@/components/landing/SaleRecordsSection";
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
