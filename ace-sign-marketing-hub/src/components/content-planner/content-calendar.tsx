"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { ApprovalBadge } from "@/components/ui/status-badge";
import { PlatformIcon, PLATFORM_DOT } from "@/components/ui/platform-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { PLATFORM_LABEL, SOCIAL_PLATFORMS, STATUS_LABEL, type ApprovalStatus } from "@/lib/types";
import { businessDay, formatDateTime } from "@/lib/time";
import type { StoredPost } from "@/server/queries";
import { cn } from "@/lib/utils";
import { PostDialog } from "./post-dialog";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_RING: Record<ApprovalStatus, string> = {
  DRAFT: "border-l-slate-300",
  IN_REVIEW: "border-l-amber-400",
  CHANGES_REQUESTED: "border-l-red-400",
  APPROVED: "border-l-emerald-500",
  SCHEDULED: "border-l-sky-500",
  PUBLISHED: "border-l-violet-500",
};

function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const startOffset = (first.getUTCDay() + 6) % 7; // Monday-first
  const start = new Date(Date.UTC(year, month, 1 - startOffset));
  const cells: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    cells.push(d.toISOString().slice(0, 10));
  }
  // trim a trailing week that is entirely next month
  return cells.slice(0, cells[35].slice(5, 7) === String(month + 1).padStart(2, "0") ? 42 : 35);
}

const shiftMonth = (ym: string, delta: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

export function ContentCalendar({
  month,
  today,
  posts,
  queue,
  canApprove,
  initialPostId,
}: {
  month: string; // yyyy-mm
  today: string;
  posts: StoredPost[];
  queue: StoredPost[];
  canApprove: boolean;
  initialPostId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [dialog, setDialog] = useState<{ post: StoredPost | null; date: string; key: number } | null>(() => {
    const p = initialPostId ? [...posts, ...queue].find((x) => x.id === initialPostId) : undefined;
    return p ? { post: p, date: businessDay(p.scheduledAt), key: 0 } : null;
  });

  const [year, mon] = month.split("-").map(Number);
  const cells = useMemo(() => monthGrid(year, mon - 1), [year, mon]);
  const byDay = useMemo(() => {
    const m = new Map<string, StoredPost[]>();
    for (const p of posts) {
      const d = businessDay(p.scheduledAt);
      m.set(d, [...(m.get(d) ?? []), p]);
    }
    return m;
  }, [posts]);
  const monthLabel = new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });

  const nav = (next: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    q.delete("post");
    for (const [k, v] of Object.entries(next)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  };
  const open = (post: StoredPost | null, date: string) => setDialog({ post, date, key: Date.now() });
  const monthPosts = useMemo(() => posts.filter((p) => businessDay(p.scheduledAt).startsWith(month)), [posts, month]);
  const counts = monthPosts.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }), {});

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="min-w-0">
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => nav({ month: shiftMonth(month, -1) })}><ChevronLeft /></Button>
            <h2 className="min-w-36 text-center text-sm font-semibold" aria-live="polite">{monthLabel}</h2>
            <Button variant="outline" size="icon" aria-label="Next month" onClick={() => nav({ month: shiftMonth(month, 1) })}><ChevronRight /></Button>
            <Button variant="ghost" size="sm" onClick={() => nav({ month: null })}>Today</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="Platform" value={params.get("platform") ?? ""} onChange={(e) => nav({ platform: e.target.value || null })} className="h-8 w-auto text-xs">
              <option value="">All platforms</option>
              {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
            </Select>
            <div role="group" aria-label="View" className="flex rounded-md bg-muted p-0.5">
              <button aria-pressed={view === "calendar"} onClick={() => setView("calendar")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs cursor-pointer", view === "calendar" ? "bg-card shadow-sm" : "text-muted-foreground")}><CalendarDays className="size-3.5" /> Month</button>
              <button aria-pressed={view === "list"} onClick={() => setView("list")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs cursor-pointer", view === "list" ? "bg-card shadow-sm" : "text-muted-foreground")}><List className="size-3.5" /> List</button>
            </div>
            <Button size="sm" onClick={() => open(null, today.startsWith(month) ? today : `${month}-01`)}><Plus /> New post</Button>
          </div>
        </CardHeader>
        <CardContent>
          {view === "calendar" ? (
            <div className="overflow-x-auto">
              <div className="grid min-w-[700px] grid-cols-7 overflow-hidden rounded-lg border bg-border gap-px">
                {WEEKDAYS.map((d) => <div key={d} className="bg-muted/60 px-2 py-1.5 text-[11px] font-medium text-muted-foreground">{d}</div>)}
                {cells.map((day) => {
                  const inMonth = day.startsWith(month);
                  const list = byDay.get(day) ?? [];
                  return (
                    <div key={day} className={cn("group relative min-h-28 bg-card p-1.5", !inMonth && "bg-muted/30")}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", day === today ? "bg-primary font-semibold text-white" : inMonth ? "" : "text-muted-foreground/60")}>
                          {Number(day.slice(8))}
                        </span>
                        <button onClick={() => open(null, day)} className="rounded p-0.5 text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100 focus:opacity-100 cursor-pointer" aria-label={`Add post on ${day}`}>
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {list.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => open(p, day)}
                            className={cn("flex w-full items-center gap-1.5 rounded border border-l-[3px] bg-card px-1.5 py-1 text-left text-[11px] hover:bg-muted/50 cursor-pointer", STATUS_RING[p.status])}
                            title={`${p.title} – ${STATUS_LABEL[p.status]}`}
                          >
                            <span className={cn("size-1.5 shrink-0 rounded-full", PLATFORM_DOT[p.platform])} aria-hidden />
                            <span className="truncate">{p.title}</span>
                            <span className="sr-only">({PLATFORM_LABEL[p.platform]}, {STATUS_LABEL[p.status]})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : monthPosts.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No posts this month" description="Create a post or move to another month." />
          ) : (
            <ul className="divide-y rounded-lg border">
              {monthPosts.map((p) => (
                <li key={p.id}>
                  <button onClick={() => open(p, businessDay(p.scheduledAt))} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 cursor-pointer">
                    <PlatformIcon platform={p.platform} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{formatDateTime(p.scheduledAt)} · {p.author}</p>
                    </div>
                    <ApprovalBadge status={p.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {(Object.keys(STATUS_RING) as ApprovalStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={cn("h-3 w-1 rounded-sm border-l-[3px]", STATUS_RING[s])} /> {STATUS_LABEL[s]} {counts[s] ? `(${counts[s]})` : ""}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Review queue</CardTitle>
          <CardDescription>{canApprove ? "Approve or request changes" : "Waiting on a manager"}</CardDescription>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nothing waiting for review.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {queue.map((p) => (
                <li key={p.id}>
                  <button onClick={() => open(p, businessDay(p.scheduledAt))} className="flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left hover:bg-muted/40 cursor-pointer">
                    <PlatformIcon platform={p.platform} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(p.scheduledAt)}</p>
                    </div>
                    <ApprovalBadge status={p.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Workflow: Draft → In review → Approved → Scheduled. Posting to Facebook, Instagram and LinkedIn needs the Phase 4 integrations and your confirmation. <Link href="/settings" className="underline">Integrations</Link>
          </p>
        </CardContent>
      </Card>

      {dialog && (
        <PostDialog
          key={dialog.key}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          post={dialog.post}
          defaultDate={dialog.date}
          canApprove={canApprove}
        />
      )}
    </div>
  );
}
