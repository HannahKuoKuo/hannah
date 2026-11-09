export const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "GOOGLE", "EMAIL"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const SOCIAL_PLATFORMS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const APPROVAL_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type CampaignStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "ACTIVE" | "PAUSED" | "COMPLETED";

/** Every record shown in the UI carries its origin so demo data is never mistaken for live data. */
export type DataSource = "DEMO" | "MANUAL" | "CSV_IMPORT" | "META" | "LINKEDIN" | "GA4" | "EMAIL_PROVIDER";

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  objective: string;
  status: CampaignStatus;
  budgetAud: number;
  startDate: string;
  endDate: string;
  source: DataSource;
}

export interface DailyMetric {
  date: string; // ISO yyyy-mm-dd
  campaignId: string;
  impressions: number;
  clicks: number;
  spendAud: number;
  conversions: number;
  /** null when revenue attribution is not available for the channel */
  revenueAud: number | null;
  engagements: number;
  leads: number;
  source: DataSource;
}

export interface CreativeAsset {
  id: string;
  name: string;
  kind: "image" | "video";
  /** Colour pair used to render a placeholder thumbnail until real assets are uploaded. */
  palette: [string, string];
  label: string;
  tags: string[];
  width: number;
  height: number;
  source: DataSource;
}

export interface AdVariation {
  id: string;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  status: ApprovalStatus;
  aiGenerated: boolean;
}

export interface ContentPost {
  id: string;
  title: string;
  body: string;
  platform: SocialPlatform;
  status: ApprovalStatus;
  scheduledAt: string; // ISO datetime
  author: string;
  source: DataSource;
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  GOOGLE: "Google Ads",
  EMAIL: "Email",
};

export const STATUS_LABEL: Record<ApprovalStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
};
