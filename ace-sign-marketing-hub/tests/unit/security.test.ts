import { describe, expect, it } from "vitest";
import { can, permissionsFor } from "@/lib/rbac";
import { redact } from "@/lib/audit";
import { integrationStatuses } from "@/lib/integrations/registry";
import { canTransition } from "@/lib/validation";

describe("role-based access", () => {
  it("restricts approval and publishing", () => {
    expect(can("EDITOR", "ads:create")).toBe(true);
    expect(can("EDITOR", "ads:approve")).toBe(false);
    expect(can("EDITOR", "ads:publish")).toBe(false);
    expect(can("MANAGER", "ads:publish")).toBe(true);
    expect(can("MANAGER", "settings:manage")).toBe(false);
    expect(can("VIEWER", "data:import")).toBe(false);
    expect(permissionsFor("ADMIN")).toContain("users:manage");
  });

  it("enforces the approval workflow", () => {
    expect(canTransition("DRAFT", "IN_REVIEW")).toBe(true);
    expect(canTransition("DRAFT", "APPROVED")).toBe(false);
    expect(canTransition("IN_REVIEW", "APPROVED")).toBe(true);
    expect(canTransition("PUBLISHED", "DRAFT")).toBe(false);
  });
});

describe("audit redaction", () => {
  it("removes contact details from metadata", () => {
    const out = redact({ email: "jo@example.com", note: "call 0412 345 678 or jo@corp.com.au", nested: { phone: "x", rows: 5 }, filename: "leads.csv" });
    expect(out).toEqual({ email: "[REDACTED]", note: "call [REDACTED_PHONE] or [REDACTED_EMAIL]", nested: { phone: "[REDACTED]", rows: 5 }, filename: "leads.csv" });
  });
});

describe("integrations", () => {
  it("are disabled by default and never expose secret values", () => {
    const s = integrationStatuses({ META_APP_SECRET: "shh" });
    expect(s.every((i) => i.state === "disabled")).toBe(true);
    expect(JSON.stringify(s)).not.toContain("shh");
  });

  it("report missing credentials when enabled", () => {
    const meta = integrationStatuses({ META_ENABLED: "true", META_APP_ID: "1" }).find((i) => i.id === "meta")!;
    expect(meta.state).toBe("missing_credentials");
    expect(meta.missing).toEqual(["META_APP_SECRET", "META_AD_ACCOUNT_ID"]);
  });
});
