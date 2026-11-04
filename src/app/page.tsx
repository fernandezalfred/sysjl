import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLandingPageData } from "@/lib/landing-data";
import { latestWorkDay } from "@/lib/sales-charts";
import { getT } from "@/lib/i18n/server";
import { defaultT, type TranslateFn } from "@/lib/i18n/translations";
import { UserTotalsSection } from "@/components/landing/UserTotalsSection";
import { AdminQuickSettings } from "@/components/landing/AdminQuickSettings";
import { TopSellerBanner } from "@/components/landing/TopSellerBanner";
import { SalesChartsSection } from "@/components/sales-charts/SalesChartsSection";
import { SelectedDayProvider } from "@/components/sales-charts/SelectedDayProvider";
import { AppHeader, AppHeaderSkeleton } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { CreateRecordButton } from "@/components/records/CreateRecordButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<LandingSkeleton t={defaultT} />}>
        <LandingContent />
      </Suspense>
    </div>
  );
}

async function LandingContent() {
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
  const isSignedIn = Boolean(session?.user?.id);

  return (
    <SelectedDayProvider defaultDay={latestWorkDay(data.dailyRecords)}>
      <div className="flex flex-col gap-8">
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 sm:p-6">
          <AppHeader
            title="Daily Sales & Stock"
            generatedAt={data.generatedAt}
            userName={session?.user?.name}
            isAdmin={isAdmin}
            isSignedIn={isSignedIn}
            activePage="home"
            locale={locale}
            t={t}
          />
          {isSignedIn ? (
            <p className="mt-3 text-sm text-foreground/60">
              {t("landing.welcomeBack", { name: session?.user?.name ?? "" })}
            </p>
          ) : (
            <p className="mt-3 text-sm text-foreground/60">{t("landing.guestTagline")}</p>
          )}
        </div>

        <TopSellerBanner userTotals={data.userTotals} isAdmin={isAdmin} t={t} />

        {isAdmin ? <AdminQuickSettings t={t} /> : null}

        <SalesChartsSection dailyRecords={data.dailyRecords} locale={locale} />

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            {t("landing.totalsByUser")}
          </h2>
          {isSignedIn ? (
            <CreateRecordButton
              isAdmin={isAdmin}
              activeUsers={activeUsers}
              currentUserName={session?.user?.name ?? null}
              locale={locale}
            />
          ) : null}
        </div>

        <UserTotalsSection
          userTotals={data.userTotals}
          dailyRecords={data.dailyRecords}
          currentUserId={session?.user?.id ?? null}
          isAdmin={isAdmin}
          hideHeading
          locale={locale}
        />

        <Footer t={t} />
      </div>
    </SelectedDayProvider>
  );
}

function LandingSkeleton({ t }: { t: TranslateFn }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 sm:p-6">
        <AppHeaderSkeleton />
        <Skeleton className="mt-3 h-4 w-40" />
      </div>

      <Skeleton className="h-24 w-full rounded-xl" />

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

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      <TableSkeleton rows={3} t={t} />
    </div>
  );
}
