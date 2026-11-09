import { NextResponse, type NextRequest } from "next/server";
import { toCsv } from "@/lib/csv";
import { parseFilters } from "@/lib/filters";
import { byCampaign, derived, sumMetrics } from "@/lib/metrics";
import { PLATFORM_LABEL } from "@/lib/types";
import { recordAudit } from "@/server/audit";
import { getCampaigns, getMetricBounds, getMetrics } from "@/server/queries";
import { requirePermission, PermissionError } from "@/server/session";

const round = (n: number | null, digits = 2) => (n === null ? "" : Number(n.toFixed(digits)));

/**
 * Downloadable CSV reports.
 *   type=daily     one row per campaign per day (default)
 *   type=campaigns one row per campaign with totals and KPIs
 * Every row carries its data source so demo rows are never mistaken for live data.
 */
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requirePermission("dashboard:view");
  } catch (e) {
    const status = e instanceof PermissionError ? 403 : 500;
    return NextResponse.json({ error: "Not allowed to export reports." }, { status });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const bounds = await getMetricBounds();
    if (!bounds.max) return NextResponse.json({ error: "No data to export." }, { status: 404 });

    const f = parseFilters(params, bounds.max);
    const type = params.type === "campaigns" ? "campaigns" : "daily";
    const [rows, campaigns] = await Promise.all([
      getMetrics({ from: f.range.from, to: f.range.to, platform: f.platform, campaignId: f.campaignId, source: f.source }),
      getCampaigns(),
    ]);
    const byId = new Map(campaigns.map((c) => [c.id, c]));
    const hasDemo = rows.some((r) => r.source === "DEMO");

    let csv: string;
    if (type === "campaigns") {
      const t = byCampaign(rows, campaigns).filter((r) => r.totals.impressions > 0 || r.totals.spendAud > 0);
      csv = toCsv(
        ["campaign", "platform", "status", "data_source", "impressions", "clicks", "ctr_pct", "spend_aud", "cpc_aud", "conversions", "leads", "cost_per_lead_aud", "revenue_aud", "roas"],
        t.map((r) => [
          r.campaign.name,
          PLATFORM_LABEL[r.campaign.platform],
          r.campaign.status,
          r.campaign.source,
          r.totals.impressions,
          r.totals.clicks,
          r.ctr === null ? "" : round(r.ctr * 100),
          round(r.totals.spendAud),
          round(r.cpc),
          r.totals.conversions,
          r.totals.leads,
          round(r.costPerLead),
          r.totals.attributedSpendAud > 0 ? round(r.totals.revenueAud) : "",
          round(r.roas),
        ]),
      );
      const total = sumMetrics(rows);
      const d = derived(total);
      csv += toCsv([], [["TOTAL", "", "", hasDemo ? "includes DEMO" : "", total.impressions, total.clicks, d.ctr === null ? "" : round(d.ctr * 100), round(total.spendAud), round(d.cpc), total.conversions, total.leads, round(d.costPerLead), total.attributedSpendAud > 0 ? round(total.revenueAud) : "", round(d.roas)]]).replace(/^\r\n/, "");
    } else {
      csv = toCsv(
        ["date", "campaign", "platform", "data_source", "impressions", "clicks", "spend_aud", "conversions", "revenue_aud", "engagements", "leads"],
        rows.map((r) => {
          const c = byId.get(r.campaignId);
          return [r.date, c?.name ?? r.campaignId, c ? PLATFORM_LABEL[c.platform] : "", r.source, r.impressions, r.clicks, round(r.spendAud), r.conversions, r.revenueAud === null ? "" : round(r.revenueAud), r.engagements, r.leads];
        }),
      );
    }

    await recordAudit({ actorId: user.id, action: "report.export", entityType: "report", metadata: { type, from: f.range.from, to: f.range.to, rows: rows.length, includesDemo: hasDemo } });

    const filename = `acesign-${type}-report_${f.range.from}_to_${f.range.to}${hasDemo ? "_INCLUDES-DEMO-DATA" : ""}.csv`;
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("report export failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "Report could not be generated." }, { status: 500 });
  }
}
