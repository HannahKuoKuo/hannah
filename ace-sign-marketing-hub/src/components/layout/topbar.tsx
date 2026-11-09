import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/server/session";
import { MobileNav } from "./mobile-nav";

async function CurrentUser() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return <span className="text-xs text-red-600">Database unavailable</span>;
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Link href="/settings#access" className="flex items-center gap-2 rounded-md p-1 hover:bg-muted" title="Switch demo user in Settings">
      <div className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">{initials}</div>
      <div className="hidden leading-tight sm:block">
        <p className="text-xs font-medium">{user.name}</p>
        <p className="text-[11px] text-muted-foreground"><span className="capitalize">{user.role.toLowerCase()}</span> · local demo session</p>
      </div>
    </Link>
  );
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
      <MobileNav />
      <form action="/campaigns" className="relative hidden max-w-sm flex-1 sm:block" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          placeholder="Search campaigns…"
          aria-label="Search campaigns"
          className="h-9 w-full rounded-md border bg-muted/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70"
        />
      </form>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 md:inline-flex">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> Safe mode · integrations off
        </span>
        <Suspense fallback={<div className="size-8 animate-pulse rounded-full bg-muted" />}>
          <CurrentUser />
        </Suspense>
      </div>
    </header>
  );
}
