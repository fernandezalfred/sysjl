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

  await prisma.vehicle.upsert({
    where: { userId: vehicleUser.id },
    update: {},
    create: {
      name: "Vehicle 1",
      userId: vehicleUser.id,
    },
  });

  // Seed an initial price per product only if none exists yet — ProductPrice is an
  // append-only history, so this must never run again once an admin has set one.
  for (const [product, purchasePrice, salePrice] of [
    ["QUESO", 7, 9],
    ["YOGURT", 25, 33],
  ] as const) {
    const existing = await prisma.productPrice.findFirst({ where: { product } });
    if (!existing) {
      await prisma.productPrice.create({
        data: { product, purchasePrice, salePrice, setById: admin.id },
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
