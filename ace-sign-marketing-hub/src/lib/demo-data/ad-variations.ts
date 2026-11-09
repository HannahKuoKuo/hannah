import type { ApprovalStatus } from "../types";

type SeedVariation = { headline: string; primaryText: string; description: string; cta: string; status: ApprovalStatus; assetId?: string };

/** DEMO DATA - example ad variations attached to the demo campaigns. */
export const DEMO_AD_VARIATIONS: Record<string, SeedVariation[]> = {
  cmp_shopfront: [
    { headline: "Shopfront signs – ACE SIGN", primaryText: "First impressions start at the street. Custom shopfront signage for retailers, designed, made and installed by one team.", description: "Design · Manufacture · Install", cta: "Get a quote", status: "APPROVED", assetId: "ast_1" },
    { headline: "Stand out on your strip", primaryText: "Turn passers-by into customers with a fascia that's impossible to miss.", description: "Australia-wide project delivery", cta: "Book a site measure", status: "IN_REVIEW", assetId: "ast_4" },
  ],
  cmp_wayfinding: [
    { headline: "Wayfinding that works for every visitor", primaryText: "Clear, compliant sign systems for hospitals, campuses and corporate sites. Talk to our team about a solution that fits your site.", description: "Compliance-ready sign systems", cta: "Get a quote", status: "APPROVED", assetId: "ast_3" },
  ],
};
