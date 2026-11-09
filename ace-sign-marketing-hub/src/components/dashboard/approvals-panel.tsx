import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApprovalBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import type { ContentPost } from "@/lib/types";
import { formatDateTime } from "@/lib/time";

export function ApprovalsPanel({ posts }: { posts: ContentPost[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>Content awaiting review or changes</CardDescription>
        </div>
        <Link href="/content-planner" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Planner <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing waiting for review.</p>
        ) : (
          <ul className="divide-y">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/content-planner?post=${p.id}`} className="flex items-center gap-3 py-2.5 hover:bg-muted/30">
                  <PlatformIcon platform={p.platform} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(p.scheduledAt)}</p>
                  </div>
                  <ApprovalBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
