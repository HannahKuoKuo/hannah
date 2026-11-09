"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { IMPORT_COLUMNS, SAMPLE_IMPORT_CSV } from "@/lib/csv-import";
import { PLATFORM_LABEL, type Platform } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { commitImport, previewImport, type ImportPreview } from "@/server/actions/imports";

export function CsvImport({ canImport }: { canImport: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, startValidate] = useTransition();
  const [importing, startImport] = useTransition();

  const formData = (f: File) => {
    const fd = new FormData();
    fd.set("file", f);
    return fd;
  };

  function choose(f: File | null) {
    setFile(f);
    setPreview(null);
    setError(null);
    if (!f) return;
    startValidate(async () => {
      const res = await previewImport(formData(f));
      if (!res.ok) setError(res.error);
      else setPreview(res.data!);
    });
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // A file picked before hydration never fired onChange - pick it up now.
  useEffect(() => {
    const early = inputRef.current?.files?.[0];
    if (early) choose(early);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_IMPORT_CSV)}`;
  const ok = preview && preview.errors.length === 0 && preview.validRows > 0;

  return (
    <Card id="import">
      <CardHeader className="flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Import campaign results (CSV)</CardTitle>
          <CardDescription>Upload daily results exported from Meta Ads Manager, LinkedIn Campaign Manager or Google Ads. Files are checked before anything is saved.</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={sampleHref} download="acesign-import-template.csv"><Download /> Template</a>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!canImport && <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">Your role cannot import data. Switch to a Manager or Admin in Settings.</p>}

        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center hover:bg-muted/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (canImport) choose(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          <FileUp className="size-6 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">{file ? file.name : "Drop a CSV here or click to choose"}</span>
          <span className="text-xs text-muted-foreground">Up to 2 MB / 10,000 rows</span>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" disabled={!canImport} aria-label="CSV file" onChange={(e) => choose(e.target.files?.[0] ?? null)} />
        </label>

        {validating && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Checking file…</p>}
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {preview && (
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-amber-600" />}
              <span className="font-medium">{preview.validRows} of {preview.totalRows} rows valid</span>
              {preview.dateRange && <span className="text-muted-foreground">· {preview.dateRange.from} to {preview.dateRange.to}</span>}
            </div>
            {preview.validRows > 0 && (
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Spend</dt><dd className="font-medium tabular-nums">{formatCurrency(preview.totals.spend)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Impressions</dt><dd className="font-medium tabular-nums">{formatNumber(preview.totals.impressions)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Clicks</dt><dd className="font-medium tabular-nums">{formatNumber(preview.totals.clicks)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Leads</dt><dd className="font-medium tabular-nums">{formatNumber(preview.totals.leads)}</dd></div>
              </dl>
            )}
            {preview.campaigns.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {preview.campaigns.map((c) => (
                  <li key={`${c.name}|${c.platform}`}>
                    <Badge variant={c.exists ? "neutral" : "info"}>{c.name} · {PLATFORM_LABEL[c.platform as Platform]} · {c.rows} rows{c.exists ? "" : " · new"}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {preview.errors.length > 0 && (
              <div className="max-h-56 overflow-auto rounded-md border border-red-200">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-red-50 text-left text-red-900">
                    <tr><th className="px-3 py-1.5">Row</th><th className="px-3 py-1.5">Column</th><th className="px-3 py-1.5">Problem</th></tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {preview.errors.map((e, i) => (
                      <tr key={i}><td className="px-3 py-1.5 tabular-nums">{e.row}</td><td className="px-3 py-1.5">{e.field ?? "—"}</td><td className="px-3 py-1.5">{e.message}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button
                disabled={!ok || importing}
                onClick={() =>
                  file &&
                  startImport(async () => {
                    const res = await commitImport(formData(file));
                    if (!res.ok) setError(res.error);
                    else {
                      toast(`Imported ${res.data!.rows} rows${res.data!.campaignsCreated ? ` and created ${res.data!.campaignsCreated} campaign(s)` : ""}.`);
                      reset();
                    }
                  })
                }
              >
                {importing ? <Loader2 className="animate-spin" /> : <Upload />} Import {preview.validRows} rows
              </Button>
            </div>
            {!ok && preview.errors.length > 0 && <p className="text-xs text-muted-foreground">Fix the rows above and upload again. Nothing is saved until every row is valid.</p>}
          </div>
        )}

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Expected columns</summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {IMPORT_COLUMNS.map((c) => (
              <li key={c.key}><code className="rounded bg-muted px-1">{c.key}</code>{c.required ? " (required)" : ""} – {c.help}</li>
            ))}
          </ul>
          <p className="mt-2">Common export headers such as &ldquo;Amount spent (AUD)&rdquo;, &ldquo;Campaign name&rdquo; and &ldquo;Link clicks&rdquo; are recognised. Re-importing the same campaign and day replaces the earlier imported value.</p>
        </details>
      </CardContent>
    </Card>
  );
}
