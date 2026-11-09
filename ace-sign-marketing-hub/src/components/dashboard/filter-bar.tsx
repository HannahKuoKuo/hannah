"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { PLATFORM_LABEL, PLATFORMS } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESETS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

export function FilterBar({
  from,
  to,
  preset,
  bounds,
  exportQuery,
  showSource = true,
}: {
  from: string;
  to: string;
  preset: string;
  bounds: { min: string; max: string };
  exportQuery: string;
  showSource?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [showCustom, setShowCustom] = useState(preset === "custom");

  function update(next: Record<string, string | null>) {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") q.delete(k);
      else q.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${q.toString()}`, { scroll: false }));
  }

  const hasFilters = params.toString().length > 0;

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">
      <div role="group" aria-label="Date range" className="flex flex-wrap items-center gap-1 rounded-md bg-muted p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            aria-pressed={preset === p.value}
            onClick={() => {
              setShowCustom(false);
              update({ range: p.value, from: null, to: null });
            }}
            className={cn("rounded px-2.5 py-1 text-xs font-medium cursor-pointer", preset === p.value ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {p.label}
          </button>
        ))}
        <button
          aria-pressed={preset === "custom"}
          onClick={() => setShowCustom((s) => !s)}
          className={cn("rounded px-2.5 py-1 text-xs font-medium cursor-pointer", preset === "custom" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ range: "custom", from: customFrom, to: customTo });
          }}
        >
          <Input type="date" aria-label="From date" value={customFrom} min={bounds.min} max={bounds.max} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 w-[9.5rem] text-xs" required />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" aria-label="To date" value={customTo} min={bounds.min} max={bounds.max} onChange={(e) => setCustomTo(e.target.value)} className="h-8 w-[9.5rem] text-xs" required />
          <Button size="sm" type="submit">Apply</Button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        <Select aria-label="Platform" value={params.get("platform") ?? ""} onChange={(e) => update({ platform: e.target.value || null, campaign: null })} className="h-8 w-auto text-xs">
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p.toLowerCase()}>{PLATFORM_LABEL[p]}</option>
          ))}
        </Select>
        {showSource && (
          <Select aria-label="Data source" value={params.get("source") ?? "all"} onChange={(e) => update({ source: e.target.value === "all" ? null : e.target.value })} className="h-8 w-auto text-xs">
            <option value="all">All data</option>
            <option value="real">Imported / live only</option>
            <option value="demo">Demo only</option>
          </Select>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}>
            <X /> Reset
          </Button>
        )}
        {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Updating" />}
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/reports/performance?${exportQuery}&type=daily`} download>
            <Download /> Export CSV
          </a>
        </Button>
      </div>
    </div>
  );
}
