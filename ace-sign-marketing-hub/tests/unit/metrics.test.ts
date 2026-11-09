import { describe, expect, it } from "vitest";
import { byCampaign, byPlatform, dailySeries, derived, sumMetrics, summarize } from "@/lib/metrics";
import type { Campaign, DailyMetric } from "@/lib/types";

const row = (over: Partial<DailyMetric>): DailyMetric => ({
  date: "2026-11-01",
  campaignId: "a",
  impressions: 1000,
  clicks: 20,
  spendAud: 40,
  conversions: 2,
  revenueAud: 200,
  engagements: 50,
  leads: 4,
  source: "DEMO",
  ...over,
});

const campaigns: Campaign[] = [
  { id: "a", name: "A", platform: "FACEBOOK", objective: "LEADS", status: "ACTIVE", budgetAud: 0, startDate: "", endDate: "", source: "DEMO" },
  { id: "b", name: "B", platform: "LINKEDIN", objective: "LEADS", status: "ACTIVE", budgetAud: 0, startDate: "", endDate: "", source: "DEMO" },
];

describe("KPI calculations", () => {
  it("computes CTR, CPC and cost per lead", () => {
    const d = derived(sumMetrics([row({}), row({ date: "2026-11-02" })]));
    expect(d.ctr).toBeCloseTo(0.02);
    expect(d.cpc).toBeCloseTo(2);
    expect(d.costPerLead).toBeCloseTo(10);
  });

  it("only counts attributed spend for ROAS", () => {
    const t = sumMetrics([row({ spendAud: 100, revenueAud: 400 }), row({ campaignId: "b", spendAud: 300, revenueAud: null })]);
    expect(t.spendAud).toBe(400);
    expect(t.attributedSpendAud).toBe(100);
    expect(derived(t).roas).toBeCloseTo(4);
  });

  it("returns null instead of dividing by zero", () => {
    const d = derived(sumMetrics([]));
    expect(d).toEqual({ ctr: null, cpc: null, roas: null, costPerLead: null });
  });

  it("compares against the previous period", () => {
    const s = summarize([row({ leads: 15 })], [row({ leads: 10 })]);
    expect(s.change.leads).toBeCloseTo(0.5);
    expect(s.hasPrevious).toBe(true);
    expect(summarize([row({})], []).change.leads).toBeNull();
  });
});

describe("series and grouping", () => {
  it("zero-fills missing days", () => {
    const s = dailySeries([row({ date: "2026-11-02" })], "2026-11-01", "2026-11-03");
    expect(s.map((p) => p.date)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
    expect(s[0].clicks).toBe(0);
    expect(s[1].clicks).toBe(20);
  });

  it("groups by campaign and platform", () => {
    const rows = [row({}), row({ campaignId: "b", leads: 7 })];
    expect(byCampaign(rows, campaigns).map((r) => r.totals.leads)).toEqual([4, 7]);
    expect(byPlatform(rows, campaigns)).toEqual(
      expect.arrayContaining([expect.objectContaining({ platform: "LINKEDIN", leads: 7 })]),
    );
  });
});
