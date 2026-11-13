import { Suspense } from "react";
import { connection } from "next/server";
import { getDailyRecordsData } from "@/lib/daily-records";
import { getCurrentPurchaseCosts } from "@/lib/money/product-prices";
import { getGrainsCostByDayAndProduct } from "@/lib/money/stock";
import { getT } from "@/lib/i18n/server";
import { BUSINESS_TIME_ZONE } from "@/lib/dates";
import { FinanceSection } from "@/components/finance/FinanceSection";
import { Skeleton } from "@/components/ui/Skeleton";

// Admin only (src/proxy.ts guards /admin): income and expenses by day, week, month or since the beginning.
export default function FinancePage() {
  return (
    <Suspense fallback={<FinanceSkeleton />}>
      <FinanceContent />
    </Suspense>
  );
}

async function FinanceContent() {
  await connection();
  const [data, unitCosts, grainsCostByDay, { t, locale }] = await Promise.all([
    getDailyRecordsData(),
    getCurrentPurchaseCosts(),
    getGrainsCostByDayAndProduct(),
    getT(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("header.finance")}</h1>
        <p className="text-sm text-foreground/70">{t("finance.subheading")}</p>
      </header>
      <FinanceSection
        dailyRecords={data.dailyRecords}
        unitCosts={unitCosts}
        grainsCostByDay={grainsCostByDay}
        generatedAt={new Intl.DateTimeFormat(locale === "es" ? "es-BO" : "en-US", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: BUSINESS_TIME_ZONE,
        }).format(new Date(data.generatedAt))}
        locale={locale}
      />
    </div>
  );
}

function FinanceSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-48" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
