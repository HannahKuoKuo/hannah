import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoNotice } from "@/components/layout/demo-notice";
import { DeleteCampaignButton, EditCampaign, PublishButton, VariationCard } from "@/components/campaigns/campaign-controls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CampaignStatusBadge, DemoBadge } from "@/components/ui/status-badge";
import { DEFAULT_BRAND } from "@/lib/demo-data/brand";
import { PLATFORM_LABEL } from "@/lib/types";
import { derived, sumMetrics } from "@/lib/metrics";
import { can } from "@/lib/rbac";
import { formatDay } from "@/lib/date-range";
import { formatCurrency, formatCurrencyPrecise, formatNumber, formatPercent } from "@/lib/utils";
import { getCampaign, getMetrics } from "@/server/queries";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Campaign" };

export default function CampaignPage({ params }: PageProps<"/campaigns/[id]">) {
  return (
    <>
      <Link href="/campaigns" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" /> Campaigns
      </Link>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <CampaignDetail params={params} />
      </Suspense>
    </>
  );
}

async function CampaignDetail({ params }: { params: PageProps<"/campaigns/[id]">["params"] }) {
  const { id } = await params;
  const [campaign, user] = await Promise.all([getCampaign(id), getCurrentUser()]);
  if (!campaign) notFound();

  const metrics = await getMetrics({ from: "2000-01-01", to: "2100-01-01", campaignId: id });
  const t = sumMetrics(metrics);
  const d = derived(t);
  const approved = campaign.variations.filter((v) => v.status === "APPROVED").length;
  const firstDay = metrics[0]?.date;
  const lastDay = metrics[metrics.length - 1]?.date;

  return (
    <>
      <PageHeader
        title={campaign.name}
        badge={
          <>
            <CampaignStatusBadge status={campaign.status} />
            {campaign.source === "DEMO" && <DemoBadge />}
          </>
        }
        description={`${PLATFORM_LABEL[campaign.platform]} · ${campaign.objective.toLowerCase()} objective`}
        actions={
          <>
            {can(user.role, "ads:approve") && <DeleteCampaignButton id={campaign.id} name={campaign.name} metricRows={metrics.length} />}
            {can(user.role, "ads:publish") && <PublishButton id={campaign.id} platform={PLATFORM_LABEL[campaign.platform]} approved={approved} />}
          </>
        }
      />
      {campaign.source === "DEMO" && <DemoNotice>This is a demo campaign. Its results are synthetic.</DemoNotice>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Ad variations ({campaign.variations.length})</h2>
            <Button variant="outline" size="sm" asChild><Link href="/ad-launcher"><Sparkles /> Generate more</Link></Button>
          </div>
          {campaign.variations.length === 0 ? (
            <EmptyState icon={Sparkles} title="No ad variations" description="Generate copy in the Ad Launcher and save it as a draft campaign." />
          ) : (
            campaign.variations.map((v, i) => (
              <VariationCard key={v.id} v={v} index={i} platform={campaign.platform} brand={DEFAULT_BRAND.name} canApprove={can(user.role, "ads:approve")} />
            ))
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>Performance (all time)</CardTitle>
                <CardDescription>{firstDay ? `${formatDay(firstDay)} – ${formatDay(lastDay!)}` : "No results recorded yet"}</CardDescription>
              </div>
              {metrics.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/api/reports/performance?range=custom&from=${firstDay}&to=${lastDay}&campaign=${campaign.id}&type=daily`} download><Download /> CSV</a>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">Results appear here after a CSV import or once the {PLATFORM_LABEL[campaign.platform]} integration is connected.</p>
              ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    ["Spend", formatCurrency(t.spendAud)],
                    ["Impressions", formatNumber(t.impressions)],
                    ["Clicks", formatNumber(t.clicks)],
                    ["CTR", d.ctr === null ? "—" : formatPercent(d.ctr)],
                    ["CPC", d.cpc === null ? "—" : formatCurrencyPrecise(d.cpc)],
                    ["Leads", formatNumber(t.leads)],
                    ["Cost / lead", d.costPerLead === null ? "—" : formatCurrencyPrecise(d.costPerLead)],
                    ["ROAS", d.roas === null ? "—" : `${d.roas.toFixed(2)}×`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="font-medium tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Campaign details</CardTitle>
              <CardDescription>Activating or approving requires the Manager or Admin role.</CardDescription>
            </CardHeader>
            <CardContent>
              <EditCampaign
                id={campaign.id}
                initial={{
                  name: campaign.name,
                  platform: campaign.platform,
                  objective: campaign.objective as "LEADS",
                  status: campaign.status,
                  budgetAud: campaign.budgetAud || undefined,
                  startDate: campaign.startDate || undefined,
                  endDate: campaign.endDate || undefined,
                  notes: campaign.notes ?? undefined,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
