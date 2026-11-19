import { prisma } from "@/lib/prisma";
import { buildCompanySummaries, type CompanySummary } from "@/lib/companies";
import { getDailyRecordsData } from "@/lib/daily-records";
import { getNetProfitInputs } from "@/lib/money/net-profit";
import { netAfterPaySince } from "@/lib/money/seller-comparison";

const RECENT_DAYS = 30;

// One company's net profit after the workers' pay (Neto − Pago) on or after `since`,
// with the same costs and grains as its Ingresos y egresos page.
async function recentNetProfit(companyId: string, since: string): Promise<number> {
  const { dailyRecords } = await getDailyRecordsData(companyId);
  const { unitCosts, deductions } = await getNetProfitInputs(dailyRecords, companyId);
  return netAfterPaySince(dailyRecords, unitCosts, deductions, since);
}

// Super admin's Companies page: every company with its sellers, admins, and the last
// 30 days' records and net profit after pay.
export async function getCompanySummaries(): Promise<CompanySummary[]> {
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const [companies, userCounts, records] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } }),
    prisma.user.groupBy({ by: ["companyId", "role"], _count: { _all: true } }),
    prisma.dailyWorkRecord.groupBy({
      by: ["companyId"],
      where: { date: { gte: since } },
      _count: { _all: true },
    }),
  ]);
  // Record dates are stored as UTC midnights and read as YYYY-MM-DD the same way.
  const sinceKey = since.toISOString().slice(0, 10);
  const netProfit = Object.fromEntries(
    await Promise.all(companies.map(async (c) => [c.id, await recentNetProfit(c.id, sinceKey)] as const)),
  );
  return buildCompanySummaries(companies, userCounts, records, netProfit);
}
