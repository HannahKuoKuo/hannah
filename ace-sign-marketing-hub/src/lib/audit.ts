/**
 * Audit logging for sensitive operations (approvals, publish attempts, imports,
 * role changes). Metadata is redacted before it is stored or printed so customer
 * contact details never reach logs.
 *
 * Entries are persisted by src/server/audit.ts.
 */

export type AuditAction =
  | "ad.generate"
  | "ad.approve"
  | "ad.reject"
  | "ad.publish_blocked"
  | "campaign.create"
  | "campaign.update"
  | "campaign.delete"
  | "content.create"
  | "content.update"
  | "content.delete"
  | "content.status_change"
  | "data.import"
  | "data.import_undo"
  | "data.demo_removed"
  | "data.demo_restored"
  | "report.export"
  | "user.role_change"
  | "integration.toggle";

export interface AuditEntry {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEYS = /^(email|phone|mobile|address|token|secret|password|apikey|api_key|authorization|contactname|contact_name|firstname|lastname|fullname)$/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?61|0)[2-478](?:[ -]?\d){8}/g;

export function redact(value: unknown, key = ""): unknown {
  if (key && SENSITIVE_KEYS.test(key)) return "[REDACTED]";
  if (typeof value === "string") {
    return value.replace(EMAIL_RE, "[REDACTED_EMAIL]").replace(PHONE_RE, "[REDACTED_PHONE]");
  }
  if (Array.isArray(value)) return value.map((v) => redact(v));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  }
  return value;
}
