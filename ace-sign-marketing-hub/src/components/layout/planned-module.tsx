import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "./page-header";

export function PlannedModule({
  title,
  description,
  icon: Icon,
  phase,
  planned,
  requires,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: number;
  planned: string[];
  requires?: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} badge={<Badge variant="neutral">Planned · Phase {phase}</Badge>} />
      <Card>
        <CardContent className="flex flex-col gap-6 p-8 md:flex-row">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="size-6 text-primary" aria-hidden />
          </div>
          <div>
            <h2 className="font-semibold">Not built yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">This module has no working features yet. Planned scope:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {planned.map((p) => <li key={p}>{p}</li>)}
            </ul>
            {requires && <p className="mt-4 text-xs text-muted-foreground">Requires: {requires}</p>}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
