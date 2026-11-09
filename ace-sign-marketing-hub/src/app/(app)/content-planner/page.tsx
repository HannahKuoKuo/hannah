import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";
import { ContentCalendar } from "@/components/content-planner/content-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/types";
import { businessDay, fromBusinessLocal } from "@/lib/time";
import { can } from "@/lib/rbac";
import { getPosts, getPostsNeedingAttention } from "@/server/queries";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Content Planner" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function ContentPlannerPage({ searchParams }: PageProps<"/content-planner">) {
  return (
    <>
      <PageHeader title="Content Planner" description="Plan Instagram, Facebook and LinkedIn posts, and move them through review and approval." />
      <Suspense fallback={<Skeleton className="h-[640px]" />}>
        <Planner searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Planner({ searchParams }: { searchParams: PageProps<"/content-planner">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const today = businessDay(new Date());
  const requested = one(sp.month);
  const month = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : today.slice(0, 7);
  const platformParam = one(sp.platform);
  const platform = SOCIAL_PLATFORMS.includes(platformParam as SocialPlatform) ? (platformParam as SocialPlatform) : undefined;

  const [y, m] = month.split("-").map(Number);
  // fetch a padded window so the leading/trailing days of the grid are populated
  const from = fromBusinessLocal(`${new Date(Date.UTC(y, m - 1, -6)).toISOString().slice(0, 10)}T00:00`);
  const to = fromBusinessLocal(`${new Date(Date.UTC(y, m, 8)).toISOString().slice(0, 10)}T00:00`);

  const [posts, queue, user] = await Promise.all([getPosts({ from, to }, platform), getPostsNeedingAttention(20), getCurrentUser()]);

  return (
    <ContentCalendar
      key={`${month}-${platform ?? "all"}`}
      month={month}
      today={today}
      posts={posts}
      queue={queue}
      canApprove={can(user.role, "content:approve")}
      initialPostId={one(sp.post)}
    />
  );
}
