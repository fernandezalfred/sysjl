import type { Role } from "@prisma/client";

export interface CompanySummary {
  id: string;
  name: string;
  isActive: boolean;
  sellers: number;
  admins: number;
  // Neto − Pago of every record in the last 30 days (net profit after the workers'
  // pay), and how many records.
  recentNetProfit: number;
  recentRecords: number;
}

interface UserCount {
  companyId: string | null;
  role: Role;
  _count: { _all: number };
}

interface RecordCount {
  companyId: string | null;
  _count: { _all: number };
}

// One summary per company (in the given order) from grouped counts of its users by
// role and of its recent records, and each company's recent net profit after pay.
export function buildCompanySummaries(
  companies: { id: string; name: string; isActive: boolean }[],
  userCounts: UserCount[],
  recentRecords: RecordCount[],
  recentNetProfit: Record<string, number>,
): CompanySummary[] {
  return companies.map((company) => {
    const countOf = (role: Role) =>
      userCounts.find((c) => c.companyId === company.id && c.role === role)?._count._all ?? 0;
    const records = recentRecords.find((r) => r.companyId === company.id);
    return {
      ...company,
      sellers: countOf("VEHICLE_USER"),
      admins: countOf("ADMIN"),
      recentNetProfit: recentNetProfit[company.id] ?? 0,
      recentRecords: records?._count._all ?? 0,
    };
  });
}
