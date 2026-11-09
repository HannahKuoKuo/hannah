"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/status-badge";
import type { SeriesPoint } from "@/lib/metrics";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

const METRICS = [
  { key: "spendAud", label: "Spend", color: "#2459d6", format: (v: number) => formatCurrency(v) },
  { key: "leads", label: "Leads", color: "#059669", format: formatNumber },
  { key: "clicks", label: "Clicks", color: "#7c3aed", format: formatNumber },
  { key: "engagements", label: "Engagements", color: "#db2777", format: formatNumber },
] as const;

const shortDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });

export function PerformanceChart({ data, demo }: { data: SeriesPoint[]; demo: boolean }) {
  const [metricKey, setMetricKey] = useState<(typeof METRICS)[number]["key"]>("spendAud");
  const metric = METRICS.find((m) => m.key === metricKey)!;
  return (
    <Card>
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Daily trend</CardTitle>
            {demo && <DemoBadge />}
          </div>
          <CardDescription>{metric.label} per day for the selected range</CardDescription>
        </div>
        <div role="tablist" aria-label="Metric" className="flex flex-wrap rounded-md bg-muted p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={metricKey === m.key}
              onClick={() => setMetricKey(m.key)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium cursor-pointer",
                metricKey === m.key ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e8ebf0" />
              <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} minTickGap={28} />
              <YAxis
                tickFormatter={(v) => (metric.key === "spendAud" ? `$${v}` : String(v))}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                width={56}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e6ec", fontSize: 12 }}
                labelFormatter={(l) => shortDate(String(l))}
                formatter={(v) => [metric.format(Number(v)), metric.label]}
              />
              <Area
                type="monotone"
                dataKey={metric.key}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={2}
                fill={`url(#fill-${metric.key})`}
                animationDuration={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
