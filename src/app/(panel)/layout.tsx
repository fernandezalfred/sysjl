import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getAccess } from "@/lib/auth/access";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import {
  paidSellerPay,
  pendingPayBySeller,
  pendingSellerPay,
  totalSellerPay,
  type SellerPending,
} from "@/lib/money/seller-pay";
import { advancesBySeller, type SellerAdvances } from "@/lib/money/pay-advances";
import { NOT_SETTLED } from "@/lib/pay-advance-filters";
import type { SellerPayTotals } from "@/components/layout/SellerPayBar";
import { PanelShell, type PanelAccess } from "@/components/layout/PanelShell";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/Skeleton";
import { LaunchProgress } from "@/components/layout/LaunchProgress";
import { defaultT } from "@/lib/i18n/translations";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[96rem] flex-1 px-4 pb-8 sm:px-6 lg:px-8 lg:pt-8">
      {/* Outside the Suspense, so it's in the static shell and paints first. */}
      <LaunchProgress label={defaultT("common.loading")} />
      <Suspense fallback={<PanelSkeleton />}>
        <PanelContent>{children}</PanelContent>
      </Suspense>
    </div>
  );
}

async function PanelContent({ children }: { children: ReactNode }) {
  await connection();
  const [session, access, { t, locale }] = await Promise.all([auth(), getAccess(), getT()]);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const [payTotals, adminPending, adminAdvances, company, companies] = await Promise.all([
    access && !access.isAdmin ? getSellerPayTotals(access.userId) : null,
    access?.isAdmin ? getPendingPayBySeller(access.companyId) : null,
    access?.isAdmin ? getAdvancesBySeller(access.companyId) : null,
    access ? prisma.company.findUnique({ where: { id: access.companyId }, select: { name: true } }) : null,
    isSuperAdmin
      ? prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } })
      : null,
  ]);
  const panelAccess: PanelAccess = {
    role: session?.user?.role ?? "VEHICLE_USER",
    permissions: session?.user?.permissions ?? [],
    companyName: company?.name ?? null,
    companies,
    activeCompanyId: access?.companyId ?? null,
  };

  return (
    <PanelShell access={panelAccess} userName={session?.user?.name} locale={locale} payTotals={payTotals} adminPending={adminPending} adminAdvances={adminAdvances}>
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

// Admins: what every seller of the company is still owed, for the header's dropdown.
async function getPendingPayBySeller(companyId: string): Promise<SellerPending[]> {
  const rows = await prisma.dailyWorkRecord.findMany({
    where: { companyId },
    select: { userId: true, totalSold: true, payPaidAt: true, user: { select: { name: true } } },
  });
  return pendingPayBySeller(
    rows.map((r) => ({ userId: r.userId, userName: r.user.name, totalSold: r.totalSold, payPaid: Boolean(r.payPaidAt), payPaidAt: r.payPaidAt })),
  );
}

// Admins: every current worker of the company (sellers and admins) with the advances they were given
// (those paid off with a payment are left out until it is undone).
async function getAdvancesBySeller(companyId: string): Promise<SellerAdvances[]> {
  const [sellers, advances] = await Promise.all([
    prisma.user.findMany({
      // Every active worker: sellers and admins alike.
      where: { companyId, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.payAdvance.findMany({
      where: { companyId, ...NOT_SETTLED },
      select: { id: true, userId: true, date: true, amount: true, description: true, user: { select: { name: true } } },
    }),
  ]);
  return advancesBySeller(
    sellers.map((u) => ({ userId: u.id, userName: u.name })),
    advances.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user.name,
      // Stored at UTC midnight of its day.
      date: a.date.toISOString().slice(0, 10),
      amount: a.amount,
      description: a.description,
    })),
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
