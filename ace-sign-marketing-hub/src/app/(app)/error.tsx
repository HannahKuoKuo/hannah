"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl border bg-card p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 size-8 text-amber-500" aria-hidden />
      <h2 className="text-lg font-semibold">This page couldn&apos;t load</h2>
      <p className="mt-1 text-sm text-muted-foreground">No changes were made to your data.</p>
      <p className="mt-3 rounded-md bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
        Running locally? Check PostgreSQL is running (<code>npm run db:up</code>) and migrations are applied (<code>npm run db:deploy</code>).
      </p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-muted-foreground">Ref: {error.digest}</p>}
      <Button className="mt-5" onClick={reset}><RotateCw /> Try again</Button>
    </div>
  );
}
