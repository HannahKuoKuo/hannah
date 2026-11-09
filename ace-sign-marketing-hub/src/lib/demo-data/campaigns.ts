import type { Campaign } from "../types";

/**
 * DEMO DATA - illustrative campaigns only. Not connected to any ad account.
 * Replace via Meta / LinkedIn / Google integrations (Phase 4) or CSV import (Phase 2).
 */
export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp_shopfront",
    name: "Shopfront Signage – Spring Retail Push",
    platform: "FACEBOOK",
    objective: "LEADS",
    status: "ACTIVE",
    budgetAud: 4500,
    startDate: "2026-09-10",
    endDate: "2026-11-30",
    source: "DEMO",
  },
  {
    id: "cmp_led",
    name: "Illuminated LED Signs – Showcase",
    platform: "INSTAGRAM",
    objective: "AWARENESS",
    status: "ACTIVE",
    budgetAud: 3200,
    startDate: "2026-09-10",
    endDate: "2026-12-15",
    source: "DEMO",
  },
  {
    id: "cmp_wayfinding",
    name: "Corporate Wayfinding – Facility Managers",
    platform: "LINKEDIN",
    objective: "LEADS",
    status: "ACTIVE",
    budgetAud: 6000,
    startDate: "2026-09-10",
    endDate: "2026-12-31",
    source: "DEMO",
  },
  {
    id: "cmp_search",
    name: "Custom Signs Near Me – Search",
    platform: "GOOGLE",
    objective: "CONVERSIONS",
    status: "ACTIVE",
    budgetAud: 5000,
    startDate: "2026-09-10",
    endDate: "2026-12-31",
    source: "DEMO",
  },
  {
    id: "cmp_builders",
    name: "Builder & Developer Partnerships",
    platform: "LINKEDIN",
    objective: "TRAFFIC",
    status: "PAUSED",
    budgetAud: 2500,
    startDate: "2026-09-10",
    endDate: "2026-11-15",
    source: "DEMO",
  },
];
