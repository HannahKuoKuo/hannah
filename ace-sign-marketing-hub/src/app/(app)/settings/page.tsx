import { Suspense } from "react";
import type { Metadata } from "next";
import { Check, ExternalLink, Minus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoUserSwitcher, RemoveDemoData } from "@/components/settings/settings-controls";
import { prisma } from "@/lib/db";
import { DEFAULT_BRAND } from "@/lib/demo-data/brand";
import { integrationStatuses } from "@/lib/integrations/registry";
import { PERMISSIONS, ROLES, ROLE_DESCRIPTIONS, can } from "@/lib/rbac";
import { formatDateTime } from "@/lib/time";
import { getAuditLog, getDemoUsers, getMetricBounds } from "@/server/queries";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Brand guidelines, integrations, access and data." />
      <Suspense fallback={<Skeleton className="h-[800px]" />}>
        <Settings />
      </Suspense>
    </>
  );
}

const STATE_BADGE = {
  disabled: <Badge variant="neutral">Disabled</Badge>,
  missing_credentials: <Badge variant="warning">Enabled · missing credentials</Badge>,
  ready: <Badge variant="info">Credentials present · not yet implemented</Badge>,
} as const;

async function Settings() {
  const [user, users, audit, bounds, brand] = await Promise.all([getCurrentUser(), getDemoUsers(), getAuditLog(), getMetricBounds(), prisma.brandProfile.findFirst()]);
  const integrations = integrationStatuses();
  const b = brand ?? DEFAULT_BRAND;
  const isAdmin = can(user.role, "settings:manage");

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Brand guidelines</CardTitle>
          <CardDescription>Starting suggestions, not confirmed ACE SIGN guidelines. Editing and AI grounding arrive in Phase 3.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{b.name}</p></div>
          <div><p className="text-xs text-muted-foreground">Voice</p><p>{b.voice}</p></div>
          <div><p className="text-xs text-muted-foreground">Audiences</p><div className="mt-1 flex flex-wrap gap-1">{b.audiences.map((a) => <Badge key={a} variant="neutral">{a}</Badge>)}</div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Do</p><ul className="mt-1 list-disc space-y-0.5 pl-4">{b.doList.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><p className="text-xs text-muted-foreground">Don&apos;t</p><ul className="mt-1 list-disc space-y-0.5 pl-4">{b.dontList.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>All off by default. Connection uses official OAuth / APIs (Phase 4) and needs your approval. Keys are read from environment variables only.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {integrations.map((i) => (
              <li key={i.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {i.name}
                    <a href={i.docsUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label={`${i.name} documentation`}><ExternalLink className="size-3" /></a>
                  </p>
                  <p className="text-xs text-muted-foreground">{i.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Enable with <code>{i.enabledFlag}=&quot;true&quot;</code>{i.missing.length > 0 && i.state !== "disabled" && <> · missing: {i.missing.join(", ")}</>}</p>
                </div>
                <div className="shrink-0">{STATE_BADGE[i.state]}</div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card id="access" className="xl:col-span-2">
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Users &amp; permissions</CardTitle>
            <CardDescription>
              Local demo session: switch user to test role permissions. This is <strong>not</strong> sign-in. Auth.js login must be enabled before this app is exposed beyond your computer.
            </CardDescription>
          </div>
          <DemoUserSwitcher users={users} current={user.email} />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-2 py-2 text-center font-medium" title={ROLE_DESCRIPTIONS[r]}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                    {r === user.role && <span className="ml-1 text-primary">(you)</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {PERMISSIONS.map((p) => (
                <tr key={p}>
                  <td className="py-1.5 pr-3 font-mono">{p}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-2 py-1.5 text-center">
                      {can(r, p) ? <Check className="mx-auto size-3.5 text-emerald-600" aria-label="allowed" /> : <Minus className="mx-auto size-3.5 text-muted-foreground/50" aria-label="not allowed" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Demo rows: {bounds.demoRows.toLocaleString("en-AU")} · imported / live rows: {bounds.realRows.toLocaleString("en-AU")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Remove demo data when you start importing real results. Requires the Admin role.</p>
          <RemoveDemoData disabled={!isAdmin || bounds.demoRows === 0} />
          {!isAdmin && <p className="text-xs text-muted-foreground">Switch to Demo Admin above to enable this.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Sensitive actions: approvals, publish attempts, imports, exports and deletions. Customer details are redacted.</CardDescription>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No audited actions yet.</p>
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {audit.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2 text-xs">
                  <code className="rounded bg-muted px-1.5 py-0.5">{a.action}</code>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.entityType}{a.entityId ? ` · ${a.entityId.slice(0, 10)}` : ""}</span>
                  <span className="shrink-0 text-muted-foreground">{a.actor} · {formatDateTime(a.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
