import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDatabase } from "../src/lib/seed-database";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

seedDatabase(prisma)
  .then((summary) => {
    console.log(
      `Seeded tenant "${summary.tenantSlug}" (${summary.tenantId}) with ${summary.branchCount} branches, ${summary.userCount} users, ${summary.permissionCount} permission rows.`,
    );
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
