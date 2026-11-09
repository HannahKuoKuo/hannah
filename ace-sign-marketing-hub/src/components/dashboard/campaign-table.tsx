import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignStatusBadge, DemoBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { PLATFORM_LABEL, type Campaign } from "@/lib/types";
import type { Totals } from "@/lib/metrics";
import { formatCurrency, formatCurrencyPrecise, formatNumber, formatPercent } from "@/lib/utils";

type Row = { campaign: Campaign; totals: Totals; ctr: number | null; cpc: number | null; roas: number | null; costPerLead: number | null };
const dash = <span className="text-muted-foreground">—</span>;

const sourceSuffix = (s: Campaign["source"]) => (s === "DEMO" ? " · demo" : s === "CSV_IMPORT" ? " · CSV" : "");

export function CampaignTable({ rows, demo, title = "Campaign overview" }: { rows: Row[]; demo: boolean; title?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          {demo && <DemoBadge />}
        </div>
        <CardDescription>Selected range. ROAS shows only where revenue attribution exists.</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-y bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Campaign</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Spend</th>
              <th className="px-3 py-2.5 text-right font-medium">Clicks</th>
              <th className="px-3 py-2.5 text-right font-medium">CTR</th>
              <th className="px-3 py-2.5 text-right font-medium">CPC</th>
              <th className="px-3 py-2.5 text-right font-medium">Leads</th>
              <th className="px-3 py-2.5 text-right font-medium">Cost / lead</th>
              <th className="px-5 py-2.5 text-right font-medium">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No campaign activity in this range.
                </td>
              </tr>
            )}
            {rows.map(({ campaign: c, totals: t, ctr, cpc, roas, costPerLead }) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform={c.platform} />
                    <div className="min-w-0">
                      <Link href={`/campaigns/${c.id}`} className="block truncate font-medium hover:text-primary hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {PLATFORM_LABEL[c.platform]}
                        {c.budgetAud ? ` · ${formatCurrency(c.budgetAud)} budget` : ""}
                        {sourceSuffix(c.source)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3"><CampaignStatusBadge status={c.status} /></td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(t.spendAud)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(t.clicks)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{ctr === null ? dash : formatPercent(ctr)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{cpc === null ? dash : formatCurrencyPrecise(cpc)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(t.leads)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{costPerLead === null ? dash : formatCurrencyPrecise(costPerLead)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{roas === null ? dash : `${roas.toFixed(2)}×`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
