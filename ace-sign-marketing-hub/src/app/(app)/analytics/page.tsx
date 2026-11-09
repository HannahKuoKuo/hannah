import { Suspense } from "react";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoNotice } from "@/components/layout/demo-notice";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { CsvImport } from "@/components/analytics/csv-import";
import { ImportHistory } from "@/components/analytics/import-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDay } from "@/lib/date-range";
import { filtersToQuery, parseFilters } from "@/lib/filters";
import { byCampaign } from "@/lib/metrics";
import { can } from "@/lib/rbac";
import { formatNumber } from "@/lib/utils";
import { getCampaigns, getImportBatches, getMetricBounds, getMetrics } from "@/server/queries";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  return (
    <>
      <PageHeader title="Analytics & reports" description="Campaign-level reporting, CSV imports and downloadable reports." />
      <Suspense fallback={<Skeleton className="h-[700px]" />}>
        <Analytics searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Analytics({ searchParams }: { searchParams: PageProps<"/analytics">["searchParams"] }) {
  const [params, bounds, user, batches] = await Promise.all([searchParams, getMetricBounds(), getCurrentUser(), getImportBatches()]);
  const canImport = can(user.role, "data:import");

  const report = bounds.max && bounds.min
    ? await (async () => {
        const f = parseFilters(params, bounds.max!);
        const [rows, campaigns] = await Promise.all([
          getMetrics({ from: f.range.from, to: f.range.to, platform: f.platform, source: f.source }),
          getCampaigns(),
        ]);
        return { f, rows, campaignRows: byCampaign(rows, campaigns).filter((r) => r.totals.impressions > 0 || r.totals.spendAud > 0), demo: rows.some((r) => r.source === "DEMO") };
      })()
    : null;

  return (
    <div className="flex flex-col gap-4">
      {report && bounds.min && bounds.max && (
        <>
          <FilterBar from={report.f.range.from} to={report.f.range.to} preset={report.f.range.preset} bounds={{ min: bounds.min, max: bounds.max }} exportQuery={filtersToQuery(report.f)} />
          {report.demo && <DemoNotice>The report below includes demo rows. Exports are labelled with a <code>data_source</code> column and an INCLUDES-DEMO-DATA file name.</DemoNotice>}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Data in workspace</CardTitle>
                <CardDescription>{formatDay(bounds.min)} – {formatDay(bounds.max)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between"><span>Imported / live rows</span><span className="font-medium tabular-nums">{formatNumber(bounds.realRows)}</span></div>
                <div className="flex justify-between"><span className="flex items-center gap-1.5">Demo rows <Badge variant="demo">demo</Badge></span><span className="font-medium tabular-nums">{formatNumber(bounds.demoRows)}</span></div>
                <div className="flex justify-between"><span>GA4 website data</span><span className="text-muted-foreground">not connected</span></div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Download reports</CardTitle>
                <CardDescription>Uses the filters above ({formatDay(report.f.range.from)} – {formatDay(report.f.range.to)}). CSV opens in Excel and Google Sheets.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild><a href={`/api/reports/performance?${filtersToQuery(report.f)}&type=campaigns`} download><Download /> Campaign summary</a></Button>
                <Button variant="outline" asChild><a href={`/api/reports/performance?${filtersToQuery(report.f)}&type=daily`} download><Download /> Daily detail</a></Button>
              </CardContent>
            </Card>
          </div>
          <CampaignTable rows={report.campaignRows} demo={report.demo} title="Campaign report" />
        </>
      )}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2"><CsvImport canImport={canImport} /></div>
        <ImportHistory batches={batches} canImport={canImport} />
      </div>
    </div>
  );
}
