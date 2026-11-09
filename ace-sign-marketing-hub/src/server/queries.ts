import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ApprovalStatus, Campaign, CampaignStatus, ContentPost, DailyMetric, DataSource, Platform, SocialPlatform } from "@/lib/types";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const day = (s: string) => new Date(`${s}T00:00:00Z`);

export interface MetricFilter {
  from: string;
  to: string;
  platform?: Platform;
  campaignId?: string;
  /** "all" | "demo" | "real" (everything except DEMO) */
  source?: "all" | "demo" | "real";
}

function metricWhere(f: MetricFilter): Prisma.MetricSnapshotWhereInput {
  return {
    date: { gte: day(f.from), lte: day(f.to) },
    ...(f.campaignId ? { campaignId: f.campaignId } : {}),
    ...(f.platform ? { campaign: { platform: f.platform } } : {}),
    ...(f.source === "demo" ? { source: "DEMO" } : f.source === "real" ? { source: { not: "DEMO" } } : {}),
  };
}

export async function getMetrics(f: MetricFilter): Promise<DailyMetric[]> {
  const rows = await prisma.metricSnapshot.findMany({ where: metricWhere(f), orderBy: { date: "asc" } });
  return rows.map((r) => ({
    date: iso(r.date),
    campaignId: r.campaignId,
    impressions: r.impressions,
    clicks: r.clicks,
    spendAud: Number(r.spendAud),
    conversions: r.conversions,
    revenueAud: r.revenueAud === null ? null : Number(r.revenueAud),
    engagements: r.engagements,
    leads: r.leads,
    source: r.source as DataSource,
  }));
}

/** Latest and earliest day with metric data - presets anchor to the latest day. */
export async function getMetricBounds(): Promise<{ min: string | null; max: string | null; demoRows: number; realRows: number }> {
  const [agg, demoRows, realRows] = await Promise.all([
    prisma.metricSnapshot.aggregate({ _min: { date: true }, _max: { date: true } }),
    prisma.metricSnapshot.count({ where: { source: "DEMO" } }),
    prisma.metricSnapshot.count({ where: { source: { not: "DEMO" } } }),
  ]);
  return { min: agg._min.date ? iso(agg._min.date) : null, max: agg._max.date ? iso(agg._max.date) : null, demoRows, realRows };
}

export type CampaignWithCounts = Campaign & { notes: string | null; variationCount: number; approvedCount: number; createdAt: string };

function mapCampaign(c: Prisma.CampaignGetPayload<{ include: { variations: { select: { status: true } } } }>): CampaignWithCounts {
  return {
    id: c.id,
    name: c.name,
    platform: c.platform as Platform,
    objective: c.objective,
    status: c.status as CampaignStatus,
    budgetAud: c.budgetAud === null ? 0 : Number(c.budgetAud),
    startDate: c.startDate ? iso(c.startDate) : "",
    endDate: c.endDate ? iso(c.endDate) : "",
    source: c.source as DataSource,
    notes: c.notes,
    variationCount: c.variations.length,
    approvedCount: c.variations.filter((v) => v.status === "APPROVED").length,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function getCampaigns(filter: { q?: string; status?: string; platform?: string } = {}): Promise<CampaignWithCounts[]> {
  const rows = await prisma.campaign.findMany({
    where: {
      ...(filter.q ? { name: { contains: filter.q, mode: "insensitive" } } : {}),
      ...(filter.status ? { status: filter.status as CampaignStatus } : {}),
      ...(filter.platform ? { platform: filter.platform as Platform } : {}),
    },
    include: { variations: { select: { status: true } } },
    orderBy: [{ updatedAt: "desc" }],
  });
  return rows.map(mapCampaign);
}

export async function getCampaign(id: string) {
  const c = await prisma.campaign.findUnique({
    where: { id },
    include: { variations: { orderBy: { createdAt: "asc" } } },
  });
  if (!c) return null;
  return {
    ...mapCampaign({ ...c, variations: c.variations }),
    variations: c.variations.map((v) => ({
      id: v.id,
      headline: v.headline,
      primaryText: v.primaryText,
      description: v.description ?? "",
      cta: v.cta,
      status: v.status as ApprovalStatus,
      assetId: v.assetId,
      aiGenerated: v.aiGenerated,
    })),
  };
}

export type StoredPost = ContentPost & { reviewNote: string | null };

export async function getPosts(range: { from: Date; to: Date }, platform?: SocialPlatform): Promise<StoredPost[]> {
  const rows = await prisma.contentPost.findMany({
    where: {
      scheduledAt: { gte: range.from, lt: range.to },
      platform: platform ? platform : { in: ["FACEBOOK", "INSTAGRAM", "LINKEDIN"] },
    },
    orderBy: { scheduledAt: "asc" },
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    platform: p.platform as SocialPlatform,
    status: p.status as ApprovalStatus,
    scheduledAt: p.scheduledAt.toISOString(),
    author: p.authorName ?? "Unknown",
    source: p.source as DataSource,
    reviewNote: p.reviewNote,
  }));
}

export async function getPostsNeedingAttention(limit = 6): Promise<StoredPost[]> {
  const rows = await prisma.contentPost.findMany({
    where: { status: { in: ["IN_REVIEW", "CHANGES_REQUESTED"] } },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    platform: p.platform as SocialPlatform,
    status: p.status as ApprovalStatus,
    scheduledAt: p.scheduledAt.toISOString(),
    author: p.authorName ?? "Unknown",
    source: p.source as DataSource,
    reviewNote: p.reviewNote,
  }));
}

export async function getImportBatches() {
  const rows = await prisma.importBatch.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { _count: { select: { metrics: true } } } });
  return rows.map((b) => ({ id: b.id, filename: b.filename, rowCount: b.rowCount, liveRows: b._count.metrics, createdBy: b.createdBy, createdAt: b.createdAt.toISOString() }));
}

export async function getAuditLog(limit = 40) {
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { actor: { select: { name: true } } } });
  return rows.map((r) => ({ id: r.id, action: r.action, entityType: r.entityType, entityId: r.entityId, actor: r.actor?.name ?? "system", createdAt: r.createdAt.toISOString(), metadata: r.metadata }));
}

export async function getDemoUsers() {
  return prisma.user.findMany({ where: { email: { endsWith: "@example.com" } }, select: { email: true, name: true, role: true }, orderBy: { role: "asc" } });
}
