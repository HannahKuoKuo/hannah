/**
 * Seeds DEMO data. Safe to re-run: it removes previous DEMO rows first and never
 * touches rows from CSV imports, manual entry or integrations.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_CAMPAIGNS } from "../src/lib/demo-data/campaigns";
import { DEMO_DAILY_METRICS } from "../src/lib/demo-data/metrics";
import { DEMO_POSTS } from "../src/lib/demo-data/content";
import { DEMO_AD_VARIATIONS } from "../src/lib/demo-data/ad-variations";
import { DEFAULT_BRAND } from "../src/lib/demo-data/brand";
import { INTEGRATIONS } from "../src/lib/integrations/registry";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const day = (d: string) => new Date(`${d}T00:00:00Z`);

async function main() {
  await prisma.$transaction([
    prisma.metricSnapshot.deleteMany({ where: { source: "DEMO" } }),
    prisma.campaign.deleteMany({ where: { source: "DEMO" } }),
    prisma.contentPost.deleteMany({ where: { source: "DEMO" } }),
  ]);

  await prisma.user.upsert({
    where: { email: "demo.manager@example.com" },
    update: {},
    create: { email: "demo.manager@example.com", name: "Demo Manager", role: "MANAGER" },
  });
  const demoUsers = [
    { email: "demo.admin@example.com", name: "Demo Admin", role: "ADMIN" as const },
    { email: "demo.editor@example.com", name: "Demo Editor", role: "EDITOR" as const },
    { email: "demo.viewer@example.com", name: "Demo Viewer", role: "VIEWER" as const },
  ];
  for (const u of demoUsers) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
  }

  for (const c of DEMO_CAMPAIGNS) {
    await prisma.campaign.create({
      data: {
        id: c.id,
        name: c.name,
        platform: c.platform,
        objective: c.objective,
        status: c.status,
        budgetAud: c.budgetAud,
        startDate: day(c.startDate),
        endDate: day(c.endDate),
        source: "DEMO",
        variations: {
          create: (DEMO_AD_VARIATIONS[c.id] ?? []).map((v) => ({ ...v, aiGenerated: true })),
        },
      },
    });
  }

  await prisma.metricSnapshot.createMany({
    data: DEMO_DAILY_METRICS.map((m) => ({
      campaignId: m.campaignId,
      date: day(m.date),
      impressions: m.impressions,
      clicks: m.clicks,
      spendAud: m.spendAud,
      conversions: m.conversions,
      revenueAud: m.revenueAud,
      engagements: m.engagements,
      leads: m.leads,
      source: "DEMO" as const,
    })),
  });

  await prisma.contentPost.createMany({
    data: DEMO_POSTS.map((p) => ({
      title: p.title,
      body: p.body,
      platform: p.platform,
      status: p.status,
      scheduledAt: new Date(`${p.scheduledAt}:00+11:00`),
      authorName: p.author,
      source: "DEMO" as const,
    })),
  });

  const brandCount = await prisma.brandProfile.count();
  if (brandCount === 0) await prisma.brandProfile.create({ data: DEFAULT_BRAND });

  for (const i of INTEGRATIONS) {
    await prisma.integrationConnection.upsert({
      where: { provider: i.id },
      update: {},
      create: { provider: i.id, enabled: false, status: "not_connected" },
    });
  }

  console.log(
    `Seeded DEMO data: ${DEMO_CAMPAIGNS.length} campaigns, ${DEMO_DAILY_METRICS.length} metric rows, ${DEMO_POSTS.length} posts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
