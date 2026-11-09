import { describe, expect, it } from "vitest";
import { AIProviderError, getAIProvider } from "@/lib/ai";
import { DEFAULT_BRAND } from "@/lib/demo-data/brand";
import { adCopyRequestSchema } from "@/lib/validation";

const req = adCopyRequestSchema.parse({ product: "LED signs", audience: "Cafe owners", platform: "LINKEDIN", objective: "LEADS", tone: "CONFIDENT", variations: 4 });

describe("AI provider abstraction", () => {
  it("defaults to the offline demo provider and labels output as demo", async () => {
    const p = getAIProvider({});
    const r = await p.generateAdCopy(req, DEFAULT_BRAND);
    expect(r.isDemo).toBe(true);
    expect(r.variations).toHaveLength(4);
    expect(r.variations[0].headline.length).toBeLessThanOrEqual(70);
    expect(new Set(r.variations.map((v) => v.primaryText)).size).toBe(4);
  });

  it("fails clearly when a real provider is not configured", () => {
    expect(() => getAIProvider({ AI_PROVIDER: "anthropic" })).toThrow(AIProviderError);
    expect(() => getAIProvider({ AI_PROVIDER: "other" })).toThrow(/Unknown/);
  });

  it("validates the brief", () => {
    expect(adCopyRequestSchema.safeParse({ ...req, variations: 9 }).success).toBe(false);
    expect(adCopyRequestSchema.safeParse({ ...req, product: "" }).success).toBe(false);
  });
});
