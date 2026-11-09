import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  change,
  hint,
  lowerIsBetter = false,
  neutral = false,
}: {
  label: string;
  value: string;
  change: number | null;
  hint?: string;
  lowerIsBetter?: boolean;
  /** direction is informational only (e.g. spend) */
  neutral?: boolean;
}) {
  const flat = change === null || Math.abs(change) < 0.005;
  const up = change !== null && change > 0;
  const good = flat || neutral ? null : lowerIsBetter ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1 py-px font-medium tabular-nums",
            good === null && "bg-muted text-muted-foreground",
            good === true && "bg-emerald-50 text-emerald-700",
            good === false && "bg-red-50 text-red-700",
          )}
        >
          <Icon className="size-3" aria-hidden />
          {change === null ? "n/a" : `${(Math.abs(change) * 100).toFixed(1)}%`}
        </span>
        <span className="truncate text-muted-foreground">{hint ?? "vs previous period"}</span>
      </div>
    </Card>
  );
}
