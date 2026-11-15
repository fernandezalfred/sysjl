import type { Role } from "@prisma/client";

export interface CompanySummary {
  id: string;
  name: string;
  isActive: boolean;
  sellers: number;
  admins: number;
  // Total venta of every record in the last 30 days, and how many records.
  recentSales: number;
  recentRecords: number;
}

interface UserCount {
  companyId: string | null;
  role: Role;
  _count: { _all: number };
}

interface SalesSum {
  companyId: string | null;
  _sum: { totalSold: number | null };
  _count: { _all: number };
}

// One summary per company (in the given order) from grouped counts of its users by
// role and of its recent sales.
export function buildCompanySummaries(
  companies: { id: string; name: string; isActive: boolean }[],
  userCounts: UserCount[],
  sales: SalesSum[],
): CompanySummary[] {
  return companies.map((company) => {
    const countOf = (role: Role) =>
      userCounts.find((c) => c.companyId === company.id && c.role === role)?._count._all ?? 0;
    const sale = sales.find((s) => s.companyId === company.id);
    return {
      ...company,
      sellers: countOf("VEHICLE_USER"),
      admins: countOf("ADMIN"),
      recentSales: sale?._sum.totalSold ?? 0,
      recentRecords: sale?._count._all ?? 0,
    };
  });
}
