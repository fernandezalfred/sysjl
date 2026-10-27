import { Suspense } from "react";
import { connection } from "next/server";
import { getLandingPageData } from "@/lib/landing-data";
import { SummaryCards } from "@/components/landing/SummaryCards";
import { UserTotalsSection } from "@/components/landing/UserTotalsSection";
import { SaleRecordsSection } from "@/components/landing/SaleRecordsSection";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<LandingSkeleton />}>
        <LandingContent />
      </Suspense>
    </div>
  );
}

async function LandingContent() {
  await connection();
  const data = await getLandingPageData();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Daily Sales & Stock</h1>
        <p className="text-sm text-foreground/60">
          Updated{" "}
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
      />

      <UserTotalsSection userTotals={data.userTotals} />

      <SaleRecordsSection dailyRecords={data.dailyRecords} />
    </div>
  );
}

function LandingSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading daily sales…</div>;
}
