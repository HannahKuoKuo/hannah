import { resolveRange, type DateRange } from "./date-range";
import { PLATFORMS, type Platform } from "./types";

export const SOURCE_FILTERS = ["all", "demo", "real"] as const;
export type SourceFilter = (typeof SOURCE_FILTERS)[number];

export interface DashboardFilters {
  range: DateRange;
  platform?: Platform;
  source: SourceFilter;
  campaignId?: string;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseFilters(params: Params, anchor: string): DashboardFilters {
  const platform = one(params.platform)?.toUpperCase();
  const source = one(params.source);
  const campaign = one(params.campaign);
  return {
    range: resolveRange({ range: one(params.range), from: one(params.from), to: one(params.to) }, anchor),
    platform: PLATFORMS.includes(platform as Platform) ? (platform as Platform) : undefined,
    source: SOURCE_FILTERS.includes(source as SourceFilter) ? (source as SourceFilter) : "all",
    campaignId: campaign && /^[a-z0-9_]{1,40}$/i.test(campaign) ? campaign : undefined,
  };
}

/** Serialise filters back to a query string (for report links). */
export function filtersToQuery(f: DashboardFilters): string {
  const q = new URLSearchParams();
  if (f.range.preset === "custom") {
    q.set("range", "custom");
    q.set("from", f.range.from);
    q.set("to", f.range.to);
  } else q.set("range", f.range.preset);
  if (f.platform) q.set("platform", f.platform.toLowerCase());
  if (f.source !== "all") q.set("source", f.source);
  if (f.campaignId) q.set("campaign", f.campaignId);
  return q.toString();
}
