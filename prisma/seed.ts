import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const SEED_PASSWORD = "ChangeMe123!";

async function main() {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sysjl.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@sysjl.local",
      passwordHash,
      role: "ADMIN",
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
    },
  });

  // Seed an initial sale price per product only if none is set yet — ProductPrice
  // holds a single current row per product, so this must never overwrite an
  // admin-set price on a later seed run.
  for (const [product, salePrice] of [
    ["QUESO", 9],
    ["YOGURT", 33],
  ] as const) {
    const existing = await prisma.productPrice.findUnique({ where: { product } });
    if (!existing) {
      await prisma.productPrice.create({
        data: { product, salePrice, setById: admin.id },
      });
    }
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.dailyWorkRecord.upsert({
    where: { userId_date: { userId: vehicleUser.id, date: today } },
    update: { totalSold: 123 },
    create: {
      userId: vehicleUser.id,
      date: today,
      quesoTaken: 80,
      quesoRemaining: 12,
      yogurtTaken: 60,
      yogurtRemaining: 5,
      totalSold: 123,
    },
  });

  console.log("Seeded users (password for both: %s):", SEED_PASSWORD);
  console.log(`  Admin:        ${admin.email}`);
  console.log(`  Vehicle user: ${vehicleUser.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
