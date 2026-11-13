import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import {
  paidSellerPay,
  pendingPayBySeller,
  pendingSellerPay,
  totalSellerPay,
  type SellerPending,
} from "@/lib/money/seller-pay";
import type { SellerPayTotals } from "@/components/layout/SellerPayBar";
import { PanelShell } from "@/components/layout/PanelShell";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[96rem] flex-1 px-4 py-8 sm:px-6 lg:px-8">
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
  const userId = session?.user?.id;
  const [payTotals, adminPending] = await Promise.all([
    userId && !isAdmin ? getSellerPayTotals(userId) : null,
    isAdmin ? getPendingPayBySeller() : null,
  ]);

  return (
    <PanelShell isAdmin={isAdmin} userName={session?.user?.name} locale={locale} payTotals={payTotals} adminPending={adminPending}>
      {children}
      <Footer t={t} />
    </PanelShell>
  );
}

// A seller's pay over every day they worked, split into what was already paid and what
// the admin hasn't paid yet.
async function getSellerPayTotals(userId: string): Promise<SellerPayTotals> {
  const rows = await prisma.dailyWorkRecord.findMany({
    where: { userId },
    select: { totalSold: true, payPaidAt: true },
  });
  const records = rows.map((r) => ({ userId, totalSold: r.totalSold, payPaid: Boolean(r.payPaidAt) }));
  return {
    earned: totalSellerPay(records, userId),
    paid: paidSellerPay(records, userId),
    pending: pendingSellerPay(records, userId),
  };
}

// Admins: what every seller is still owed, for the header's dropdown.
async function getPendingPayBySeller(): Promise<SellerPending[]> {
  const rows = await prisma.dailyWorkRecord.findMany({
    select: { userId: true, totalSold: true, payPaidAt: true, user: { select: { name: true } } },
  });
  return pendingPayBySeller(
    rows.map((r) => ({ userId: r.userId, userName: r.user.name, totalSold: r.totalSold, payPaid: Boolean(r.payPaidAt) })),
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="flex items-center justify-between gap-3 border-b border-foreground/10 pb-4 lg:hidden">
        <Skeleton className="h-8 w-9" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="hidden h-[calc(100dvh-4rem)] w-64 flex-shrink-0 flex-col gap-2 rounded-2xl border border-foreground/10 p-4 lg:flex">
        <Skeleton className="mb-4 h-10 w-32" />
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
