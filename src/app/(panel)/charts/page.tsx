import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getDailyRecordsData, recordsVisibleTo } from "@/lib/daily-records";
import { latestWorkDay } from "@/lib/sales-charts";
import { getT } from "@/lib/i18n/server";
import { SalesChartsSection } from "@/components/sales-charts/SalesChartsSection";
import { SelectedDayProvider } from "@/components/sales-charts/SelectedDayProvider";
import { Skeleton } from "@/components/ui/Skeleton";

interface ChartsPageProps {
  // ?day=YYYY-MM-DD, set by the day headers in Sale Records.
  searchParams: Promise<{ day?: string }>;
}

export default function ChartsPage({ searchParams }: ChartsPageProps) {
  return (
    <Suspense fallback={<ChartsSkeleton />}>
      <ChartsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ChartsContent({ searchParams }: ChartsPageProps) {
  await connection();
  const [data, session, { t, locale }, { day }] = await Promise.all([getDailyRecordsData(), auth(), getT(), searchParams]);
  const isAdmin = session?.user?.role === "ADMIN";
  // A seller only sees their own records.
  const dailyRecords = recordsVisibleTo(data.dailyRecords, session?.user?.id ?? null, isAdmin);
  const pickedDay = day && dailyRecords.some((r) => r.date === day) ? day : null;

  return (
    <SelectedDayProvider defaultDay={pickedDay ?? latestWorkDay(dailyRecords)}>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{t("header.charts")}</h1>
          <p className="text-sm text-foreground/70">{t("charts.subheading")}</p>
        </header>
        <SalesChartsSection dailyRecords={dailyRecords} locale={locale} />
      </div>
    </SelectedDayProvider>
  );
}

function ChartsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
