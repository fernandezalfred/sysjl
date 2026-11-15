import { prisma } from "@/lib/prisma";
import { buildCompanySummaries, type CompanySummary } from "@/lib/companies";

const RECENT_DAYS = 30;

// Super admin's Companies page: every company with its sellers, admins and the last
// 30 days of sales.
export async function getCompanySummaries(): Promise<CompanySummary[]> {
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const [companies, userCounts, sales] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } }),
    prisma.user.groupBy({ by: ["companyId", "role"], _count: { _all: true } }),
    prisma.dailyWorkRecord.groupBy({
      by: ["companyId"],
      where: { date: { gte: since } },
      _sum: { totalSold: true },
      _count: { _all: true },
    }),
  ]);
  return buildCompanySummaries(companies, userCounts, sales);
}
