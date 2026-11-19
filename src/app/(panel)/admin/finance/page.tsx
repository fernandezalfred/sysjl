import { Suspense } from "react";
import { connection } from "next/server";
import { requirePageAccess } from "@/lib/auth/access";
import { getDailyRecordsData } from "@/lib/daily-records";
import { getNetProfitInputs } from "@/lib/money/net-profit";
import { getT } from "@/lib/i18n/server";
import { FinanceSection } from "@/components/finance/FinanceSection";
import { Skeleton } from "@/components/ui/Skeleton";

// Admins with the Finance permission (src/proxy.ts guards /admin): sellers compared
// over the same number of days worked, and the company's total Neto.
export default function FinancePage() {
  return (
    <Suspense fallback={<FinanceSkeleton />}>
      <FinanceContent />
    </Suspense>
  );
}

async function FinanceContent() {
  await connection();
  const { companyId } = await requirePageAccess("FINANCE");
  const [data, { t, locale }] = await Promise.all([getDailyRecordsData(companyId), getT()]);
  const { unitCosts, deductions } = await getNetProfitInputs(data.dailyRecords, companyId);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("header.finance")}</h1>
        <p className="text-sm text-foreground/70">{t("finance.subheading")}</p>
      </header>
      <FinanceSection dailyRecords={data.dailyRecords} unitCosts={unitCosts} deductions={deductions} locale={locale} />
    </div>
  );
}

function FinanceSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
