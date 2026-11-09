import { ShieldCheck } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { SidebarNav } from "./sidebar-nav";

export function SidebarFooter() {
  return (
    <div className="rounded-lg border border-white/5 bg-sidebar-accent/50 p-3 text-[11px] leading-relaxed text-sidebar-muted">
      <p className="mb-1 flex items-center gap-1.5 font-medium text-sidebar-foreground">
        <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden /> Safe mode
      </p>
      Integrations are off. Nothing is published or sent without your confirmation.
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-sidebar px-4 py-5 lg:flex">
      <div className="px-1">
        <BrandMark />
      </div>
      <div className="flex-1">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted/70">Workspace</p>
        <SidebarNav />
      </div>
      <SidebarFooter />
    </aside>
  );
}
