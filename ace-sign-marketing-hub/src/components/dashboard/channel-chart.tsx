"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/status-badge";
import { PLATFORM_LABEL, type Platform } from "@/lib/types";

const COLORS: Record<Platform, string> = {
  FACEBOOK: "#2563eb",
  INSTAGRAM: "#db2777",
  LINKEDIN: "#0369a1",
  GOOGLE: "#059669",
  EMAIL: "#64748b",
};

export function ChannelChart({ data, demo }: { data: { platform: Platform; leads: number }[]; demo: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const rows = data.map((d) => ({ ...d, name: PLATFORM_LABEL[d.platform] })).sort((a, b) => b.leads - a.leads);

  function select(platform: Platform) {
    const q = new URLSearchParams(params.toString());
    q.set("platform", platform.toLowerCase());
    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Leads by channel</CardTitle>
          {demo && <DemoBadge />}
        </div>
        <CardDescription>Click a bar to filter the dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">No channel data in this range.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#e8ebf0" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#334155" }} width={84} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e6ec", fontSize: 12 }} />
                <Bar
                  dataKey="leads"
                  name="Leads"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  animationDuration={400}
                  className="cursor-pointer"
                  onClick={(d) => select((d as unknown as { platform: Platform }).platform)}
                >
                  {rows.map((r) => (
                    <Cell key={r.platform} fill={COLORS[r.platform]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
