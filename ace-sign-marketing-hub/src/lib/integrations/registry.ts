/**
 * Third-party integrations. Every integration is disabled unless its *_ENABLED
 * flag is "true" AND the required credentials are present. Credentials are read
 * from env only and never returned to the client - only their presence is.
 */

export type IntegrationId = "meta" | "linkedin" | "ga4" | "email";

export interface IntegrationDefinition {
  id: IntegrationId;
  name: string;
  description: string;
  phase: number;
  enabledFlag: string;
  requiredEnv: string[];
  docsUrl: string;
  capabilities: string[];
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "meta",
    name: "Meta Marketing API",
    description: "Facebook & Instagram campaign drafts, insights and publishing (with confirmation).",
    phase: 4,
    enabledFlag: "META_ENABLED",
    requiredEnv: ["META_APP_ID", "META_APP_SECRET", "META_AD_ACCOUNT_ID"],
    docsUrl: "https://developers.facebook.com/docs/marketing-apis",
    capabilities: ["Read campaign insights", "Create paused campaign drafts", "Publish after approval"],
  },
  {
    id: "linkedin",
    name: "LinkedIn Marketing API",
    description: "Company page posts and Campaign Manager reporting.",
    phase: 4,
    enabledFlag: "LINKEDIN_ENABLED",
    requiredEnv: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    docsUrl: "https://learn.microsoft.com/en-us/linkedin/marketing/",
    capabilities: ["Read ad analytics", "Schedule organic posts after approval"],
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Website sessions, conversions and attribution via the GA4 Data API.",
    phase: 4,
    enabledFlag: "GA4_ENABLED",
    requiredEnv: ["GA4_PROPERTY_ID", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    docsUrl: "https://developers.google.com/analytics/devguides/reporting/data/v1",
    capabilities: ["Read traffic and conversion reports"],
  },
  {
    id: "email",
    name: "Email service (MailerLite)",
    description: "Newsletter drafts, segments and campaign reporting.",
    phase: 4,
    enabledFlag: "EMAIL_PROVIDER_ENABLED",
    requiredEnv: ["EMAIL_PROVIDER_API_KEY"],
    docsUrl: "https://developers.mailerlite.com/docs/",
    capabilities: ["Sync segments", "Create draft campaigns", "Send after confirmation"],
  },
];

export type IntegrationState = "disabled" | "missing_credentials" | "ready";

export interface IntegrationStatus extends Omit<IntegrationDefinition, "requiredEnv"> {
  state: IntegrationState;
  missing: string[];
}

export function integrationStatuses(env: Record<string, string | undefined> = process.env): IntegrationStatus[] {
  return INTEGRATIONS.map(({ requiredEnv, ...def }) => {
    const enabled = env[def.enabledFlag] === "true";
    const missing = requiredEnv.filter((k) => !env[k]);
    const state: IntegrationState = !enabled ? "disabled" : missing.length ? "missing_credentials" : "ready";
    return { ...def, state, missing };
  });
}
