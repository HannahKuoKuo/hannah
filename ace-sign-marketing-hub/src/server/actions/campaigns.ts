"use server";

import { invalidateAll } from "./invalidate";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { adVariationSchema, campaignSchema, canTransition, type CampaignInput } from "@/lib/validation";
import { APPROVAL_STATUSES } from "@/lib/types";
import { recordAudit } from "../audit";
import { requirePermission } from "../session";
import { failure, type ActionResult } from "./result";

const day = (s?: string) => (s ? new Date(`${s}T00:00:00Z`) : null);

export async function createCampaign(input: CampaignInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("ads:create");
    const parsed = campaignSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
    const d = parsed.data;
    // Editors may only create drafts; approving needs ads:approve.
    if (d.status !== "DRAFT" && d.status !== "IN_REVIEW") await requirePermission("ads:approve");
    const c = await prisma.campaign.create({
      data: { name: d.name, platform: d.platform, objective: d.objective, status: d.status, budgetAud: d.budgetAud ?? null, startDate: day(d.startDate), endDate: day(d.endDate), notes: d.notes || null, source: "MANUAL" },
    });
    await recordAudit({ actorId: user.id, action: "campaign.create", entityType: "campaign", entityId: c.id, metadata: { status: d.status, platform: d.platform } });
    invalidateAll();
    return { ok: true, data: { id: c.id }, message: "Campaign created." };
  } catch (e) {
    return failure(e);
  }
}

export async function updateCampaign(id: string, input: CampaignInput): Promise<ActionResult> {
  try {
    const user = await requirePermission("ads:create");
    const parsed = campaignSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
    const existing = await prisma.campaign.findUnique({ where: { id }, select: { status: true } });
    if (!existing) return { ok: false, error: "Campaign not found." };
    const d = parsed.data;
    if (d.status !== existing.status && !["DRAFT", "IN_REVIEW"].includes(d.status)) await requirePermission("ads:approve");
    await prisma.campaign.update({
      where: { id },
      data: { name: d.name, platform: d.platform, objective: d.objective, status: d.status, budgetAud: d.budgetAud ?? null, startDate: day(d.startDate), endDate: day(d.endDate), notes: d.notes || null },
    });
    await recordAudit({ actorId: user.id, action: "campaign.update", entityType: "campaign", entityId: id, metadata: { from: existing.status, to: d.status } });
    invalidateAll();
    return { ok: true, message: "Campaign saved." };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("ads:approve");
    const c = await prisma.campaign.findUnique({ where: { id }, select: { id: true, _count: { select: { metrics: true } } } });
    if (!c) return { ok: false, error: "Campaign not found." };
    await prisma.campaign.delete({ where: { id } });
    await recordAudit({ actorId: user.id, action: "campaign.delete", entityType: "campaign", entityId: id, metadata: { metricRowsRemoved: c._count.metrics } });
    invalidateAll();
    return { ok: true, message: "Campaign deleted." };
  } catch (e) {
    return failure(e);
  }
}

const saveDraftSchema = z.object({
  campaign: campaignSchema,
  variations: z.array(adVariationSchema).min(1, "Add at least one variation").max(10),
});

/** Save Ad Launcher output as a DRAFT campaign. Nothing is sent to any ad platform. */
export async function saveAdDraft(input: z.input<typeof saveDraftSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("ads:create");
    const parsed = saveDraftSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid draft." };
    const { campaign: d, variations } = parsed.data;
    const c = await prisma.campaign.create({
      data: {
        name: d.name,
        platform: d.platform,
        objective: d.objective,
        status: "DRAFT",
        budgetAud: d.budgetAud ?? null,
        startDate: day(d.startDate),
        endDate: day(d.endDate),
        notes: d.notes || null,
        source: "MANUAL",
        variations: { create: variations.map((v) => ({ ...v, assetId: v.assetId ?? null, status: "DRAFT" as const })) },
      },
    });
    await recordAudit({ actorId: user.id, action: "campaign.create", entityType: "campaign", entityId: c.id, metadata: { via: "ad-launcher", variations: variations.length } });
    invalidateAll();
    return { ok: true, data: { id: c.id }, message: "Draft campaign saved." };
  } catch (e) {
    return failure(e);
  }
}

export async function setVariationStatus(variationId: string, status: (typeof APPROVAL_STATUSES)[number]): Promise<ActionResult> {
  try {
    const needsApprove = status === "APPROVED" || status === "CHANGES_REQUESTED" || status === "SCHEDULED";
    const user = await requirePermission(needsApprove ? "ads:approve" : "ads:create");
    if (!APPROVAL_STATUSES.includes(status)) return { ok: false, error: "Unknown status." };
    const v = await prisma.adVariation.findUnique({ where: { id: variationId }, select: { status: true, campaignId: true } });
    if (!v) return { ok: false, error: "Variation not found." };
    if (!canTransition(v.status, status)) return { ok: false, error: `Cannot move from ${v.status} to ${status}.` };
    await prisma.adVariation.update({ where: { id: variationId }, data: { status } });
    await recordAudit({ actorId: user.id, action: status === "APPROVED" ? "ad.approve" : status === "CHANGES_REQUESTED" ? "ad.reject" : "campaign.update", entityType: "ad_variation", entityId: variationId, metadata: { from: v.status, to: status, campaignId: v.campaignId } });
    invalidateAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteVariation(variationId: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("ads:create");
    await prisma.adVariation.delete({ where: { id: variationId } });
    await recordAudit({ actorId: user.id, action: "campaign.update", entityType: "ad_variation", entityId: variationId, metadata: { deleted: true } });
    invalidateAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** Publishing is intentionally blocked until an ad platform integration is connected and confirmed. */
export async function requestPublish(campaignId: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("ads:publish");
    await recordAudit({ actorId: user.id, action: "ad.publish_blocked", entityType: "campaign", entityId: campaignId, metadata: { reason: "integration_not_connected" } });
    return { ok: false, error: "Publishing is disabled: no ad platform is connected. Nothing was sent." };
  } catch (e) {
    return failure(e);
  }
}
