"use server";

import { invalidateAll } from "./invalidate";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { APPROVAL_STATUSES } from "@/lib/types";
import { canTransition, contentPostSchema, type ContentPostInput } from "@/lib/validation";
import { recordAudit } from "../audit";
import { requirePermission } from "../session";
import { failure, type ActionResult } from "./result";

export async function createPost(input: ContentPostInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("content:create");
    const parsed = contentPostSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
    const d = parsed.data;
    const p = await prisma.contentPost.create({
      data: { title: d.title, body: d.body, platform: d.platform, scheduledAt: new Date(d.scheduledAt), status: "DRAFT", authorName: user.name, source: "MANUAL" },
    });
    await recordAudit({ actorId: user.id, action: "content.create", entityType: "content_post", entityId: p.id, metadata: { platform: d.platform } });
    invalidateAll();
    return { ok: true, data: { id: p.id }, message: "Draft created." };
  } catch (e) {
    return failure(e);
  }
}

export async function updatePost(id: string, input: ContentPostInput): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:create");
    const parsed = contentPostSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
    const existing = await prisma.contentPost.findUnique({ where: { id }, select: { status: true } });
    if (!existing) return { ok: false, error: "Post not found." };
    if (existing.status === "PUBLISHED") return { ok: false, error: "Published posts cannot be edited." };
    const d = parsed.data;
    // Editing approved/scheduled copy sends it back to draft so it is re-reviewed.
    const resetStatus = existing.status === "APPROVED" || existing.status === "SCHEDULED";
    await prisma.contentPost.update({
      where: { id },
      data: { title: d.title, body: d.body, platform: d.platform, scheduledAt: new Date(d.scheduledAt), ...(resetStatus ? { status: "DRAFT" } : {}) },
    });
    await recordAudit({ actorId: user.id, action: "content.update", entityType: "content_post", entityId: id, metadata: { resetToDraft: resetStatus } });
    invalidateAll();
    return { ok: true, message: resetStatus ? "Saved. Status reset to Draft for re-approval." : "Saved." };
  } catch (e) {
    return failure(e);
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:create");
    const existing = await prisma.contentPost.findUnique({ where: { id }, select: { status: true } });
    if (!existing) return { ok: false, error: "Post not found." };
    if (existing.status === "PUBLISHED") return { ok: false, error: "Published posts cannot be deleted here." };
    await prisma.contentPost.delete({ where: { id } });
    await recordAudit({ actorId: user.id, action: "content.delete", entityType: "content_post", entityId: id });
    invalidateAll();
    return { ok: true, message: "Post deleted." };
  } catch (e) {
    return failure(e);
  }
}

const statusSchema = z.object({ status: z.enum(APPROVAL_STATUSES), note: z.string().trim().max(500).optional() });

export async function setPostStatus(id: string, input: z.input<typeof statusSchema>): Promise<ActionResult> {
  try {
    const parsed = statusSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid status." };
    const { status, note } = parsed.data;
    if (status === "PUBLISHED") return { ok: false, error: "Publishing requires a connected social account (Phase 4). Nothing was posted." };
    const needsApprove = status === "APPROVED" || status === "CHANGES_REQUESTED" || status === "SCHEDULED";
    const user = await requirePermission(needsApprove ? "content:approve" : "content:create");
    const existing = await prisma.contentPost.findUnique({ where: { id }, select: { status: true } });
    if (!existing) return { ok: false, error: "Post not found." };
    if (!canTransition(existing.status, status)) return { ok: false, error: `Cannot move from ${existing.status} to ${status}.` };
    if (status === "CHANGES_REQUESTED" && !note) return { ok: false, error: "Add a note explaining the requested changes." };
    await prisma.contentPost.update({ where: { id }, data: { status, reviewNote: status === "CHANGES_REQUESTED" ? note : status === "IN_REVIEW" ? undefined : null } });
    await recordAudit({ actorId: user.id, action: "content.status_change", entityType: "content_post", entityId: id, metadata: { from: existing.status, to: status } });
    invalidateAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
