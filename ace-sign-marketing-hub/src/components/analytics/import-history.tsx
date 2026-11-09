"use client";

import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { formatDateTime } from "@/lib/time";
import { undoImport } from "@/server/actions/imports";

type Batch = { id: string; filename: string; rowCount: number; liveRows: number; createdBy: string | null; createdAt: string };

export function ImportHistory({ batches, canImport }: { batches: Batch[]; canImport: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import history</CardTitle>
        <CardDescription>Undo removes the rows an import added or replaced.</CardDescription>
      </CardHeader>
      <CardContent>
        {batches.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No imports yet.</p>
        ) : (
          <ul className="divide-y">
            {batches.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(b.createdAt)} · {b.liveRows}/{b.rowCount} rows active{b.createdBy ? ` · ${b.createdBy}` : ""}
                  </p>
                </div>
                {canImport && (
                  <ConfirmDialog
                    trigger={<Button variant="ghost" size="sm" aria-label={`Undo import ${b.filename}`}><Undo2 /> Undo</Button>}
                    title="Undo this import?"
                    description={<>This deletes the {b.liveRows} metric rows from <strong>{b.filename}</strong>. Campaigns created by the import are kept.</>}
                    confirmLabel="Undo import"
                    onConfirm={async () => {
                      const res = await undoImport(b.id);
                      if (!res.ok) return res.error;
                      toast("Import removed.");
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
