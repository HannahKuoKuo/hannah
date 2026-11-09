import type { Campaign, DailyMetric, Platform } from "./types";
import { percentChange, ratio } from "./utils";
import { addDays } from "./date-range";

export interface Totals {
  impressions: number;
  clicks: number;
  spendAud: number;
  conversions: number;
  revenueAud: number;
  /** spend on rows that have revenue attribution - ROAS is only computed over these */
  attributedSpendAud: number;
  engagements: number;
  leads: number;
}

export function sumMetrics(rows: DailyMetric[]): Totals {
  return rows.reduce<Totals>(
    (t, r) => {
      t.impressions += r.impressions;
      t.clicks += r.clicks;
      t.spendAud += r.spendAud;
      t.conversions += r.conversions;
      t.engagements += r.engagements;
      t.leads += r.leads;
      if (r.revenueAud !== null) {
        t.revenueAud += r.revenueAud;
        t.attributedSpendAud += r.spendAud;
      }
      return t;
    },
    { impressions: 0, clicks: 0, spendAud: 0, conversions: 0, revenueAud: 0, attributedSpendAud: 0, engagements: 0, leads: 0 },
  );
}

export function derived(t: Totals) {
  return {
    ctr: ratio(t.clicks, t.impressions),
    cpc: ratio(t.spendAud, t.clicks),
    roas: ratio(t.revenueAud, t.attributedSpendAud),
    costPerLead: ratio(t.spendAud, t.leads),
  };
}

export function summarize(current: DailyMetric[], previous: DailyMetric[]) {
  const c = sumMetrics(current);
  const p = sumMetrics(previous);
  const cd = derived(c);
  const pd = derived(p);
  const delta = (a: number | null, b: number | null) => (a === null || b === null ? null : percentChange(a, b));
  return {
    totals: c,
    derived: cd,
    hasPrevious: previous.length > 0,
    change: {
      spendAud: percentChange(c.spendAud, p.spendAud),
      leads: percentChange(c.leads, p.leads),
      engagements: percentChange(c.engagements, p.engagements),
      clicks: percentChange(c.clicks, p.clicks),
      ctr: delta(cd.ctr, pd.ctr),
      cpc: delta(cd.cpc, pd.cpc),
      roas: delta(cd.roas, pd.roas),
      costPerLead: delta(cd.costPerLead, pd.costPerLead),
    },
  };
}

export type SeriesPoint = { date: string; spendAud: number; clicks: number; leads: number; engagements: number };

/** Daily totals with zero-filled gaps between `from` and `to` (inclusive). */
export function dailySeries(rows: DailyMetric[], from?: string, to?: string): SeriesPoint[] {
  const map = new Map<string, SeriesPoint>();
  if (from && to) {
    for (let d = from; d <= to; d = addDays(d, 1)) map.set(d, { date: d, spendAud: 0, clicks: 0, leads: 0, engagements: 0 });
  }
  for (const r of rows) {
    const e = map.get(r.date) ?? { date: r.date, spendAud: 0, clicks: 0, leads: 0, engagements: 0 };
    e.spendAud += r.spendAud;
    e.clicks += r.clicks;
    e.leads += r.leads;
    e.engagements += r.engagements;
    map.set(r.date, e);
  }
  return [...map.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ ...e, spendAud: Math.round(e.spendAud * 100) / 100 }));
}

export function byCampaign(rows: DailyMetric[], campaigns: Campaign[]) {
  return campaigns.map((c) => {
    const t = sumMetrics(rows.filter((r) => r.campaignId === c.id));
    return { campaign: c, totals: t, ...derived(t) };
  });
}

export function byPlatform(rows: DailyMetric[], campaigns: Campaign[]) {
  const platformOf = new Map(campaigns.map((c) => [c.id, c.platform]));
  const acc = new Map<Platform, { leads: number; spendAud: number; clicks: number }>();
  for (const r of rows) {
    const p = platformOf.get(r.campaignId);
    if (!p) continue;
    const e = acc.get(p) ?? { leads: 0, spendAud: 0, clicks: 0 };
    e.leads += r.leads;
    e.spendAud += r.spendAud;
    e.clicks += r.clicks;
    acc.set(p, e);
  }
  return [...acc.entries()].map(([platform, v]) => ({ platform, ...v, spendAud: Math.round(v.spendAud) }));
}
