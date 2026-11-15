// One-off: moves the data from before companies existed into a first company.
//
//   npx prisma db push
//   npx tsx prisma/migrate-to-companies.ts --company "Nombre de la empresa" [--super admin@correo]
//
// Creates the company (or uses the oldest one), makes one admin the super admin (the
// one with --super, else the oldest admin; an existing super admin is kept), gives
// every other admin all permissions, and puts every user, sale record, price and
// grain purchase without a company into it. Safe to run again.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { ADMIN_PERMISSIONS } from "../src/lib/auth/permissions";
import { planCompanyMigration } from "../src/lib/company-migration";

const prisma = new PrismaClient();

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
}

// Documents written before the field existed don't have it at all.
const WITHOUT_COMPANY = { OR: [{ companyId: { isSet: false } }, { companyId: null }] };

async function main() {
  const companyName = argument("company") ?? "Empresa principal";
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
  const plan = planCompanyMigration(users, argument("super"));
  if (!plan.ok) throw new Error(plan.reason);

  const company =
    (await prisma.company.findFirst({ orderBy: { createdAt: "asc" } })) ??
    (await prisma.company.create({ data: { name: companyName } }));

  if (plan.promote) {
    await prisma.user.update({
      where: { id: plan.superAdminId },
      data: { role: "SUPER_ADMIN", companyId: null, permissions: [] },
    });
  }
  const admins = await prisma.user.updateMany({
    where: { id: { in: plan.adminIds }, ...WITHOUT_COMPANY },
    data: { companyId: company.id, permissions: ADMIN_PERMISSIONS },
  });
  const others = await prisma.user.updateMany({
    where: { role: { not: "SUPER_ADMIN" }, ...WITHOUT_COMPANY },
    data: { companyId: company.id },
  });
  const data = { companyId: company.id };
  const [records, prices, purchases] = await Promise.all([
    prisma.dailyWorkRecord.updateMany({ where: WITHOUT_COMPANY, data }),
    prisma.productPrice.updateMany({ where: WITHOUT_COMPANY, data }),
    prisma.stockPurchase.updateMany({ where: WITHOUT_COMPANY, data }),
  ]);

  const superAdmin = users.find((u) => u.id === plan.superAdminId)!;
  console.log(`Company: ${company.name} (${company.id})`);
  console.log(`Super admin: ${superAdmin.email}${plan.promote ? " (promoted)" : " (already)"}`);
  console.log(`Moved into the company: ${admins.count} admins, ${others.count} other users,`);
  console.log(`  ${records.count} sale records, ${prices.count} prices, ${purchases.count} grain purchases`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
