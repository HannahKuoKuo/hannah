import type { DailyMetric } from "../types";
import { DEMO_CAMPAIGNS } from "./campaigns";

/** Fixed reference date so demo numbers are deterministic and clearly a demo period. */
export const DEMO_PERIOD_END = "2026-11-08";
export const DEMO_DAYS = 60;

type Profile = {
  impressions: number;
  ctr: number;
  cpc: number;
  cvr: number;
  aov: number | null;
  engagementRate: number;
  leadRate: number;
};

/** Share of conversions (quote requests) that become paid jobs - keeps demo ROAS in a plausible range. */
const CLOSE_RATE = 0.07;

const PROFILES: Record<string, Profile> = {
  cmp_shopfront: { impressions: 9200, ctr: 0.0142, cpc: 1.18, cvr: 0.045, aov: 2400, engagementRate: 0.031, leadRate: 0.06 },
  cmp_led: { impressions: 12800, ctr: 0.0096, cpc: 0.92, cvr: 0.018, aov: 3100, engagementRate: 0.052, leadRate: 0.02 },
  cmp_wayfinding: { impressions: 3600, ctr: 0.0071, cpc: 6.4, cvr: 0.065, aov: null, engagementRate: 0.018, leadRate: 0.09 },
  cmp_search: { impressions: 2100, ctr: 0.064, cpc: 2.35, cvr: 0.072, aov: 1850, engagementRate: 0, leadRate: 0.075 },
  cmp_builders: { impressions: 1800, ctr: 0.0058, cpc: 5.1, cvr: 0.03, aov: null, engagementRate: 0.014, leadRate: 0.05 },
};

/** Mulberry32 - tiny deterministic PRNG so every render shows the same demo figures. */
function prng(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDay(base: Date, offset: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function build(): DailyMetric[] {
  const end = new Date(`${DEMO_PERIOD_END}T00:00:00Z`);
  const rows: DailyMetric[] = [];
  DEMO_CAMPAIGNS.forEach((c, ci) => {
    const p = PROFILES[c.id];
    const rand = prng(1000 + ci * 97);
    for (let i = DEMO_DAYS - 1; i >= 0; i--) {
      const date = isoDay(end, -i);
      const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
      const weekday = dow === 0 || dow === 6 ? 0.72 : 1;
      const trend = 1 + ((DEMO_DAYS - i) / DEMO_DAYS) * 0.22; // gentle growth over the period
      const paused = c.status === "PAUSED" && i < 12;
      const noise = 0.82 + rand() * 0.36;
      const impressions = paused ? 0 : Math.round(p.impressions * weekday * trend * noise);
      const clicks = Math.round(impressions * p.ctr * (0.9 + rand() * 0.2));
      const spendAud = Math.round(clicks * p.cpc * (0.92 + rand() * 0.16) * 100) / 100;
      const conversions = Math.round(clicks * p.cvr * (0.7 + rand() * 0.6));
      rows.push({
        date,
        campaignId: c.id,
        impressions,
        clicks,
        spendAud,
        conversions,
        revenueAud: p.aov === null ? null : Math.round(conversions * CLOSE_RATE * p.aov * (0.8 + rand() * 0.4)),
        engagements: Math.round(impressions * p.engagementRate * (0.85 + rand() * 0.3)),
        leads: Math.round(clicks * p.leadRate * (0.6 + rand() * 0.8)),
        source: "DEMO",
      });
    }
  });
  return rows;
}

/** DEMO DATA - synthetic daily metrics. Never present these as live results. */
export const DEMO_DAILY_METRICS: DailyMetric[] = build();
