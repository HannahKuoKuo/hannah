import { z } from "zod";
import { APPROVAL_STATUSES, PLATFORMS, SOCIAL_PLATFORMS } from "./types";
import { isIsoDay } from "./date-range";

export const AD_PLATFORMS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN"] as const;
export const AD_OBJECTIVES = ["AWARENESS", "TRAFFIC", "LEADS", "CONVERSIONS"] as const;
export const AD_TONES = ["PROFESSIONAL", "CONFIDENT", "FRIENDLY", "TECHNICAL"] as const;

export const adCopyRequestSchema = z.object({
  product: z.string().trim().min(2, "Describe the product or service").max(120),
  audience: z.string().trim().min(2, "Describe the target audience").max(160),
  keyMessage: z.string().trim().max(280).optional().default(""),
  platform: z.enum(AD_PLATFORMS),
  objective: z.enum(AD_OBJECTIVES),
  tone: z.enum(AD_TONES),
  variations: z.coerce.number().int().min(1).max(6),
});
export type AdCopyRequest = z.infer<typeof adCopyRequestSchema>;
export type AdCopyRequestInput = z.input<typeof adCopyRequestSchema>;

export const contentPostSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  body: z.string().trim().min(1, "Post copy is required").max(3000),
  platform: z.enum(SOCIAL_PLATFORMS),
  /** ISO datetime with offset - the browser converts its local time before submitting */
  scheduledAt: z.iso.datetime({ offset: true, message: "Choose a valid date and time" }),
});
export type ContentPostInput = z.input<typeof contentPostSchema>;

export const CAMPAIGN_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "ACTIVE", "PAUSED", "COMPLETED"] as const;
export const CAMPAIGN_OBJECTIVES = AD_OBJECTIVES;

const optionalDay = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || isIsoDay(v), "Use a valid date");

export const campaignSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(120),
    platform: z.enum(PLATFORMS),
    objective: z.enum(AD_OBJECTIVES),
    status: z.enum(CAMPAIGN_STATUSES),
    budgetAud: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.coerce.number({ error: "Budget must be a number" }).min(0, "Budget cannot be negative").max(10_000_000).optional(),
    ),
    startDate: optionalDay,
    endDate: optionalDay,
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((c) => !c.startDate || !c.endDate || c.startDate <= c.endDate, { message: "End date must be on or after the start date", path: ["endDate"] });
export type CampaignInput = z.input<typeof campaignSchema>;

export const adVariationSchema = z.object({
  headline: z.string().trim().min(1, "Headline is required").max(120),
  primaryText: z.string().trim().min(1, "Primary text is required").max(1000),
  description: z.string().trim().max(200).optional().default(""),
  cta: z.string().trim().min(1).max(40),
  assetId: z.string().max(40).nullable().optional(),
  aiGenerated: z.boolean().optional().default(false),
});

/** Allowed approval transitions. Approve / request changes require the approve permission. */
export const APPROVAL_TRANSITIONS: Record<(typeof APPROVAL_STATUSES)[number], readonly (typeof APPROVAL_STATUSES)[number][]> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["APPROVED", "CHANGES_REQUESTED", "DRAFT"],
  CHANGES_REQUESTED: ["IN_REVIEW", "DRAFT"],
  APPROVED: ["SCHEDULED", "DRAFT"],
  SCHEDULED: ["APPROVED", "DRAFT"],
  PUBLISHED: [],
};

export function canTransition(from: (typeof APPROVAL_STATUSES)[number], to: (typeof APPROVAL_STATUSES)[number]) {
  return APPROVAL_TRANSITIONS[from].includes(to);
}

/** Platform copy limits (characters) used for inline warnings. */
export const PLATFORM_LIMITS = {
  FACEBOOK: { headline: 40, primaryText: 125 },
  INSTAGRAM: { headline: 40, primaryText: 125 },
  LINKEDIN: { headline: 70, primaryText: 150 },
} as const;
