import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getLandingPageData } from "@/lib/landing-data";
import { getNetProfitInputs } from "@/lib/net-profit";
import { buildQuickStats, type QuickStatsData } from "@/lib/quick-stats";
import { getCurrentStock } from "@/lib/stock";
import { formatDateKey } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { PanelShell } from "@/components/layout/PanelShell";
import { Footer } from "@/components/layout/Footer";
import { QuickStats } from "@/components/layout/QuickStats";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<PanelSkeleton />}>
        <PanelContent>{children}</PanelContent>
      </Suspense>
    </div>
  );
}

async function PanelContent({ children }: { children: ReactNode }) {
  await connection();
  const [session, { t, locale }] = await Promise.all([auth(), getT()]);
  const isAdmin = session?.user?.role === "ADMIN";
  const stats = isAdmin ? await getQuickStats() : null;

  return (
    <PanelShell isAdmin={isAdmin} userName={session?.user?.name} locale={locale}>
      {stats ? <QuickStats stats={stats} t={t} locale={locale} /> : null}
      {children}
      <Footer t={t} />
    </PanelShell>
  );
}

// Admin-only: includes Net profit, which is cost/financial data.
async function getQuickStats(): Promise<QuickStatsData> {
  const [{ dailyRecords }, quesoStock, yogurtStock] = await Promise.all([
    getLandingPageData(),
    getCurrentStock("QUESO"),
    getCurrentStock("YOGURT"),
  ]);
  const { unitCosts, deductions } = await getNetProfitInputs(dailyRecords);
  const month = formatDateKey(new Date()).slice(0, 7);

  return buildQuickStats(dailyRecords, unitCosts, deductions, month, { QUESO: quesoStock, YOGURT: yogurtStock });
}

function PanelSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="flex items-center justify-between gap-3 border-b border-foreground/10 pb-4 lg:hidden">
        <Skeleton className="h-8 w-9" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="hidden w-56 flex-shrink-0 flex-col gap-2 border-r border-foreground/10 pr-4 lg:sticky lg:top-0 lg:flex lg:self-start lg:pt-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="hidden items-center justify-end gap-3 lg:flex">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
