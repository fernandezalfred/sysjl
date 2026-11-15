import { describe, expect, it } from "vitest";
import { buildCompanySummaries } from "@/lib/companies";

describe("buildCompanySummaries", () => {
  it("puts each company's sellers, admins and recent sales together, zero when it has none", () => {
    const companies = [
      { id: "c1", name: "JL", isActive: true },
      { id: "c2", name: "Nueva", isActive: false },
    ];
    const userCounts = [
      { companyId: "c1", role: "VEHICLE_USER" as const, _count: { _all: 12 } },
      { companyId: "c1", role: "ADMIN" as const, _count: { _all: 2 } },
      { companyId: null, role: "SUPER_ADMIN" as const, _count: { _all: 1 } },
    ];
    const sales = [{ companyId: "c1", _sum: { totalSold: 54000 }, _count: { _all: 20 } }];

    expect(buildCompanySummaries(companies, userCounts, sales)).toEqual([
      { id: "c1", name: "JL", isActive: true, sellers: 12, admins: 2, recentSales: 54000, recentRecords: 20 },
      { id: "c2", name: "Nueva", isActive: false, sellers: 0, admins: 0, recentSales: 0, recentRecords: 0 },
    ]);
  });
});
