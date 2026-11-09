import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "";
if (!/_test\b|_test\?/.test(url)) throw new Error("cleanup only runs against a *_test database");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const e2e = { startsWith: "E2E " };
  await prisma.importBatch.deleteMany({ where: { filename: { in: ["good.csv", "bad.csv"] } } });
  await prisma.campaign.deleteMany({ where: { name: e2e } });
  await prisma.contentPost.deleteMany({ where: { title: e2e } });
}

main().finally(() => prisma.$disconnect());
