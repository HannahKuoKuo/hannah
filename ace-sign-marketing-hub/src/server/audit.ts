import "server-only";
import { prisma } from "@/lib/db";
import { redact, type AuditEntry } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

/** Persist an audit entry. Metadata is redacted; failures never break the user's action. */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata ? (redact(entry.metadata) as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    console.error("audit write failed:", err instanceof Error ? err.name : "unknown");
  }
}
