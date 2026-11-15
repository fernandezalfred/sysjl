import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { ADMIN_PERMISSIONS } from "../src/lib/auth/permissions";

const prisma = new PrismaClient();

const SEED_PASSWORD = "ChangeMe123!";
const SEED_COMPANY = "Empresa demo";

// A fresh database: the super admin, one company with its admin (every permission)
// and a seller, starting prices and one sale record. Safe to re-run.
async function main() {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@sysjl.local" },
    update: {},
    create: { name: "Super Admin", email: "super@sysjl.local", passwordHash, role: "SUPER_ADMIN" },
  });

  const company =
    (await prisma.company.findFirst({ where: { name: SEED_COMPANY } })) ??
    (await prisma.company.create({ data: { name: SEED_COMPANY } }));

  const admin = await prisma.user.upsert({
    where: { email: "admin@sysjl.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@sysjl.local",
      passwordHash,
      role: "ADMIN",
      companyId: company.id,
      permissions: ADMIN_PERMISSIONS,
    },
  });

  const vehicleUser = await prisma.user.upsert({
    where: { email: "carla@sysjl.local" },
    update: {},
    create: {
      name: "Carla Mamani",
      email: "carla@sysjl.local",
      passwordHash,
      role: "VEHICLE_USER",
      companyId: company.id,
    },
  });

  // Seed an initial sale price per product only if none is set yet — never overwrite
  // an admin-set price on a later seed run.
  for (const [product, salePrice] of [
    ["QUESO", 9],
    ["YOGURT", 33],
  ] as const) {
    const existing = await prisma.productPrice.findUnique({
      where: { companyId_product: { companyId: company.id, product } },
    });
    if (!existing) {
      await prisma.productPrice.create({ data: { companyId: company.id, product, salePrice, setById: admin.id } });
    }
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.dailyWorkRecord.upsert({
    where: { userId_date: { userId: vehicleUser.id, date: today } },
    update: { totalSold: 123 },
    create: {
      userId: vehicleUser.id,
      companyId: company.id,
      date: today,
      quesoTaken: 80,
      quesoRemaining: 12,
      yogurtTaken: 60,
      yogurtRemaining: 5,
      totalSold: 123,
    },
  });

  console.log("Seeded users (password for all: %s):", SEED_PASSWORD);
  console.log(`  Super admin:  ${superAdmin.email}`);
  console.log(`  Admin:        ${admin.email} (${company.name})`);
  console.log(`  Vehicle user: ${vehicleUser.email} (${company.name})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
