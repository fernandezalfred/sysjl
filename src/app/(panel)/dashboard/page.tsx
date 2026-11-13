import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDailyRecordsData, recordsVisibleTo } from "@/lib/daily-records";
import { getNetProfitInputs } from "@/lib/money/net-profit";
import { getCurrentProductPrices } from "@/lib/money/product-prices";
import { latestWorkDay } from "@/lib/sales-charts";
import { getT } from "@/lib/i18n/server";
import { defaultT, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import { BUSINESS_TIME_ZONE } from "@/lib/dates";
import { SaleRecordsSection } from "@/components/sale-records/SaleRecordsSection";
import { SalesChartsSection } from "@/components/sales-charts/SalesChartsSection";
import { SelectedDayProvider } from "@/components/sales-charts/SelectedDayProvider";
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
    getDailyRecordsData(),
    auth(),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getT(),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";
  // A seller only sees their own records (charts and table). Filtered here, after the
  // day's winner/loser was worked out against every seller, so others' rows never
  // reach the browser.
  const dailyRecords = recordsVisibleTo(data.dailyRecords, session?.user?.id ?? null, isAdmin);
  // Earned (profit) is cost/financial data per project-overview.md §3 — admin-only,
  // so the cost lookup and its use below are both gated on isAdmin.
  const [prices, netProfitInputs] = isAdmin
    ? await Promise.all([getCurrentProductPrices(), getNetProfitInputs(data.dailyRecords)])
    : [null, null];

  const unitCosts = netProfitInputs?.unitCosts ?? null;
  const deductions = netProfitInputs?.deductions ?? null;

  return (
    <SelectedDayProvider defaultDay={latestWorkDay(dailyRecords)}>
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("header.dashboard")}</h1>
          <UpdatedAt iso={data.generatedAt} label={t("header.updated")} locale={locale} />
        </header>

        <SalesChartsSection dailyRecords={dailyRecords} locale={locale} />

        <SaleRecordsSection
          dailyRecords={dailyRecords}
          currentUserId={session?.user?.id ?? null}
          currentUserName={session?.user?.name ?? null}
          isAdmin={isAdmin}
          activeUsers={activeUsers}
          locale={locale}
          unitCosts={unitCosts}
          deductions={deductions}
        />

        {isAdmin && prices ? (
          <section aria-labelledby="sale-prices-heading" className="flex flex-col gap-3">
            <h2
              id="sale-prices-heading"
              className="text-sm font-medium uppercase tracking-wide text-foreground/70"
            >
              {t("adminProducts.heading")}
            </h2>
            <p className="text-sm text-foreground/70">{t("adminProducts.subheading")}</p>
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
      </div>
    </SelectedDayProvider>
  );
}

interface UpdatedAtProps {
  iso: string;
  label: string;
  locale: Locale;
}

// "● Actualizado · jue, 13 nov 2026 · 16:05", in Bolivia time whatever the
// server's own timezone (UTC on Vercel).
function UpdatedAt({ iso, label, locale }: UpdatedAtProps) {
  const date = new Date(iso);
  const intlLocale = locale === "es" ? "es-BO" : "en-US";
  const day = new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date);
  const time = new Intl.DateTimeFormat(intlLocale, {
    hour: locale === "es" ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle: locale === "es" ? "h23" : "h12",
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date);

  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.04] px-3 py-1 text-xs text-foreground/70">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span className="font-medium text-foreground/80">{label}</span>
      <span aria-hidden="true" className="text-foreground/30">·</span>
      <time dateTime={iso} className="tabular-nums">
        {day} · {time}
      </time>
    </p>
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
        <Skeleton className="h-4 w-28" />
        <TableSkeleton rows={2} t={t} tableFrom="2xl" />
      </div>
    </div>
  );
}
