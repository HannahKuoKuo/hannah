import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NewCampaignButton } from "@/components/campaigns/new-campaign-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignStatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { PLATFORM_LABEL, PLATFORMS } from "@/lib/types";
import { CAMPAIGN_STATUSES } from "@/lib/validation";
import { formatDay } from "@/lib/date-range";
import { formatCurrency } from "@/lib/utils";
import { getCampaigns } from "@/server/queries";

export const metadata: Metadata = { title: "Campaigns" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ");

export default function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  return (
    <>
      <PageHeader title="Campaigns" description="Create, edit and review campaigns and their ad variations." actions={<NewCampaignButton />} />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <CampaignList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function CampaignList({ searchParams }: { searchParams: PageProps<"/campaigns">["searchParams"] }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 80);
  const status = CAMPAIGN_STATUSES.includes(one(sp.status) as (typeof CAMPAIGN_STATUSES)[number]) ? one(sp.status) : "";
  const platform = PLATFORMS.includes(one(sp.platform) as (typeof PLATFORMS)[number]) ? one(sp.platform) : "";
  const campaigns = await getCampaigns({ q, status, platform });
  const filtered = Boolean(q || status || platform);

  return (
    <>
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <Input name="q" defaultValue={q} placeholder="Search by name…" aria-label="Search campaigns" className="max-w-xs" />
        <Select name="status" defaultValue={status} aria-label="Status" className="w-auto">
          <option value="">All statuses</option>
          {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{title(s)}</option>)}
        </Select>
        <Select name="platform" defaultValue={platform} aria-label="Platform" className="w-auto">
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
        </Select>
        <Button type="submit" variant="secondary">Filter</Button>
        {filtered && <Button variant="ghost" asChild><Link href="/campaigns">Clear</Link></Button>}
      </form>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={filtered ? "No campaigns match these filters" : "No campaigns yet"}
          description={filtered ? "Try different filters." : "Create a campaign, generate one in the Ad Launcher, or import a CSV."}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Campaign</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Objective</th>
                  <th className="px-3 py-2.5 font-medium">Dates</th>
                  <th className="px-3 py-2.5 text-right font-medium">Budget</th>
                  <th className="px-5 py-2.5 text-right font-medium">Ad variations</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon platform={c.platform} />
                        <div className="min-w-0">
                          <Link href={`/campaigns/${c.id}`} className="block truncate font-medium hover:text-primary hover:underline">{c.name}</Link>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {PLATFORM_LABEL[c.platform]}
                            {c.source === "DEMO" && <Badge variant="demo" className="px-1.5 py-0 text-[9px]">Demo</Badge>}
                            {c.source === "CSV_IMPORT" && <Badge variant="neutral" className="px-1.5 py-0 text-[9px]">CSV</Badge>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><CampaignStatusBadge status={c.status} /></td>
                    <td className="px-3 py-3 text-muted-foreground">{title(c.objective)}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {c.startDate ? formatDay(c.startDate, { day: "numeric", month: "short" }) : "—"} – {c.endDate ? formatDay(c.endDate) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{c.budgetAud ? formatCurrency(c.budgetAud) : "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {c.variationCount ? `${c.approvedCount}/${c.variationCount} approved` : <span className="text-muted-foreground">none</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
