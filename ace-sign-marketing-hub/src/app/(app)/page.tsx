import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CalendarPlus, Database, Megaphone, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoNotice } from "@/components/layout/demo-notice";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { ChannelChart } from "@/components/dashboard/channel-chart";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { ApprovalsPanel } from "@/components/dashboard/approvals-panel";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PLATFORM_LABEL } from "@/lib/types";
import { formatDay } from "@/lib/date-range";
import { filtersToQuery, parseFilters } from "@/lib/filters";
import { byCampaign, byPlatform, dailySeries, summarize } from "@/lib/metrics";
import { formatCompact, formatCurrency, formatCurrencyPrecise, formatNumber, formatPercent } from "@/lib/utils";
import { getCampaigns, getMetricBounds, getMetrics, getPostsNeedingAttention } from "@/server/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Marketing performance across paid and organic channels."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/content-planner"><CalendarPlus /> Plan content</Link>
            </Button>
            <Button asChild>
              <Link href="/ad-launcher"><Megaphone /> New ad</Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DashboardContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [params, bounds] = await Promise.all([searchParams, getMetricBounds()]);

  if (!bounds.max || !bounds.min) {
    return (
      <EmptyState
        icon={Database}
        title="No performance data yet"
        description="Import a CSV export from your ad platforms, or load the demo data with `npm run db:seed`."
        action={
          <Button asChild>
            <Link href="/analytics#import"><Upload /> Import CSV</Link>
          </Button>
        }
      />
    );
  }

  const f = parseFilters(params, bounds.max);
  const base = { platform: f.platform, campaignId: f.campaignId, source: f.source };
  const [current, previous, campaigns, attention] = await Promise.all([
    getMetrics({ ...base, from: f.range.from, to: f.range.to }),
    getMetrics({ ...base, from: f.range.previous.from, to: f.range.previous.to }),
    getCampaigns(),
    getPostsNeedingAttention(),
  ]);

  const { totals: t, derived: d, change, hasPrevious } = summarize(current, previous);
  const demoInView = current.some((r) => r.source === "DEMO");
  const realInView = current.some((r) => r.source !== "DEMO");
  const campaignRows = byCampaign(current, campaigns).filter((r) => r.totals.impressions > 0 || r.totals.spendAud > 0);
  const hint = hasPrevious ? `vs prior ${f.range.days} days` : "no prior data";

  return (
    <>
      <FilterBar
        from={f.range.from}
        to={f.range.to}
        preset={f.range.preset}
        bounds={{ min: bounds.min, max: bounds.max }}
        exportQuery={filtersToQuery(f)}
      />

      <p className="-mt-2 mb-4 text-xs text-muted-foreground">
        Showing <strong className="font-medium text-foreground">{formatDay(f.range.from)} – {formatDay(f.range.to)}</strong>
        {f.platform && <> · {PLATFORM_LABEL[f.platform]}</>}
        {" "}· {formatNumber(current.length)} data rows
        {demoInView && realInView && " · mix of demo and imported data"}
      </p>

      {demoInView && (
        <DemoNotice>
          <strong>Includes demo data.</strong> Rows marked demo are synthetic and only show how the dashboard works. Choose
          &ldquo;Imported / live only&rdquo; to hide them, or remove them in Settings. Live results arrive with CSV imports now and
          platform integrations in Phase 4.
        </DemoNotice>
      )}

      {current.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data for these filters"
          description="Try a wider date range, another platform, or a different data source."
        />
      ) : (
        <>
          <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Ad spend" value={formatCurrency(t.spendAud)} change={change.spendAud} hint={hint} neutral />
            <KpiCard label="Leads" value={formatNumber(t.leads)} change={change.leads} hint={hint} />
            <KpiCard label="Cost per lead" value={d.costPerLead === null ? "—" : formatCurrencyPrecise(d.costPerLead)} change={change.costPerLead} hint={hint} lowerIsBetter />
            <KpiCard label="Engagements" value={formatCompact(t.engagements)} change={change.engagements} hint={hint} />
            <KpiCard label="Clicks" value={formatNumber(t.clicks)} change={change.clicks} hint={hint} />
            <KpiCard label="CTR" value={d.ctr === null ? "—" : formatPercent(d.ctr)} change={change.ctr} hint={hint} />
            <KpiCard label="Avg. CPC" value={d.cpc === null ? "—" : formatCurrencyPrecise(d.cpc)} change={change.cpc} hint={hint} lowerIsBetter />
            <KpiCard
              label="ROAS"
              value={d.roas === null ? "—" : `${d.roas.toFixed(2)}×`}
              change={change.roas}
              hint={d.roas === null ? "no revenue attribution" : "attributed channels only"}
            />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <PerformanceChart data={dailySeries(current, f.range.from, f.range.to)} demo={demoInView} />
            </div>
            <ChannelChart data={byPlatform(current, campaigns)} demo={demoInView} />
          </section>
        </>
      )}

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <CampaignTable rows={campaignRows} demo={demoInView} />
        </div>
        <ApprovalsPanel posts={attention} />
      </section>
    </>
  );
}
