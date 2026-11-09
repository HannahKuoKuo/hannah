"use server";

import { cookies } from "next/headers";
import { invalidateAll } from "./invalidate";
import { prisma } from "@/lib/db";
import { recordAudit } from "../audit";
import { DEMO_USER_COOKIE, requirePermission } from "../session";
import { failure, type ActionResult } from "./result";

/** Switch the local demo user (for testing role permissions). Not authentication. */
export async function switchDemoUser(email: string): Promise<ActionResult> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !email.endsWith("@example.com")) return { ok: false, error: "Unknown demo user." };
    (await cookies()).set(DEMO_USER_COOKIE, email, { httpOnly: true, sameSite: "lax", path: "/" });
    invalidateAll();
    return { ok: true, message: `Now acting as ${user.name}.` };
  } catch (e) {
    return failure(e);
  }
}

/** Remove all DEMO-sourced rows. Imported and manually created data is kept. */
export async function removeDemoData(confirmation: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("settings:manage");
    if (confirmation !== "REMOVE DEMO DATA") return { ok: false, error: "Type REMOVE DEMO DATA to confirm." };
    const [metrics, campaigns, posts] = await prisma.$transaction([
      prisma.metricSnapshot.deleteMany({ where: { source: "DEMO" } }),
      prisma.campaign.deleteMany({ where: { source: "DEMO" } }),
      prisma.contentPost.deleteMany({ where: { source: "DEMO" } }),
    ]);
    await recordAudit({ actorId: user.id, action: "data.demo_removed", entityType: "workspace", metadata: { metrics: metrics.count, campaigns: campaigns.count, posts: posts.count } });
    invalidateAll();
    return { ok: true, message: "Demo data removed. Run `npm run db:seed` to restore it." };
  } catch (e) {
    return failure(e);
  }
}
