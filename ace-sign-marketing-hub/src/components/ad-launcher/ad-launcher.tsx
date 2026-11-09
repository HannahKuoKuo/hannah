"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, Image as ImageIcon, Loader2, RefreshCw, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DemoBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toaster";
import { AD_OBJECTIVES, AD_PLATFORMS, AD_TONES, PLATFORM_LIMITS, adCopyRequestSchema, type AdCopyRequestInput } from "@/lib/validation";
import { PLATFORM_LABEL, type AdVariation, type CreativeAsset } from "@/lib/types";
import type { AdCopyResult } from "@/lib/ai/types";
import { saveAdDraft } from "@/server/actions/campaigns";
import { cn } from "@/lib/utils";
import { AdPreview } from "./ad-preview";
import { AssetThumb } from "./asset-thumb";

type AdPlatform = (typeof AD_PLATFORMS)[number];
type WorkingVariation = AdVariation & { assetId: string | null; selected: boolean };

const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const DEFAULT_BRIEF: AdCopyRequestInput = {
  product: "Illuminated shopfront signage",
  audience: "Retail and hospitality business owners",
  keyMessage: "Free site measure and design consultation",
  platform: "FACEBOOK",
  objective: "LEADS",
  tone: "PROFESSIONAL",
  variations: 3,
};

function CharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className={cn("text-[11px] tabular-nums", over ? "font-medium text-amber-700" : "text-muted-foreground")}>
      {value.length}/{limit}
      {over && " · may be truncated"}
    </span>
  );
}

export function AdLauncher({ assets, brandName }: { assets: CreativeAsset[]; brandName: string }) {
  const router = useRouter();
  const [brief, setBrief] = useState<AdCopyRequestInput>(DEFAULT_BRIEF);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ platform: AdPlatform; isDemo: boolean; provider: string } | null>(null);
  const [variations, setVariations] = useState<WorkingVariation[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const set = <K extends keyof AdCopyRequestInput>(k: K, v: AdCopyRequestInput[K]) => setBrief((b) => ({ ...b, [k]: v }));

  async function generate() {
    setError(null);
    const parsed = adCopyRequestSchema.safeParse(brief);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/ai/ad-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldErrors(json.fieldErrors ?? {});
        throw new Error(json.error ?? `Request failed (${res.status})`);
      }
      const data = json as AdCopyResult;
      const stamp = Date.now().toString(36);
      setResult({ platform: parsed.data.platform, isDemo: data.isDemo, provider: data.provider });
      setVariations(
        data.variations.map((v, i) => ({
          ...v,
          id: `${stamp}-${i}`,
          status: "DRAFT",
          aiGenerated: true,
          assetId: assets[i % assets.length]?.id ?? null,
          selected: true,
        })),
      );
      setPreviewId(`${stamp}-0`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  const update = (id: string, patch: Partial<WorkingVariation>) => setVariations((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  const limits = PLATFORM_LIMITS[result?.platform ?? (brief.platform as AdPlatform)];
  const preview = variations.find((v) => v.id === previewId) ?? variations[0];
  const selectedCount = variations.filter((v) => v.selected).length;

  return (
    <Tabs defaultValue="create">
      <TabsList>
        <TabsTrigger value="create"><Wand2 /> Create</TabsTrigger>
        <TabsTrigger value="assets"><ImageIcon /> Asset library</TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_340px]">
          {/* Brief */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Campaign brief</CardTitle>
              <CardDescription>Describe what you&apos;re promoting and who to.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-3.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  generate();
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="product">Product or service</Label>
                  <Input id="product" value={brief.product} onChange={(e) => set("product", e.target.value)} aria-invalid={!!fieldErrors.product} />
                  <FieldError>{fieldErrors.product?.[0]}</FieldError>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="audience">Target audience</Label>
                  <Input id="audience" value={brief.audience} onChange={(e) => set("audience", e.target.value)} aria-invalid={!!fieldErrors.audience} />
                  <FieldError>{fieldErrors.audience?.[0]}</FieldError>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="keyMessage">Key message / offer <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Textarea id="keyMessage" rows={2} value={brief.keyMessage} onChange={(e) => set("keyMessage", e.target.value)} />
                  <FieldError>{fieldErrors.keyMessage?.[0]}</FieldError>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="platform">Platform</Label>
                    <Select id="platform" value={brief.platform} onChange={(e) => set("platform", e.target.value as AdPlatform)}>
                      {AD_PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="objective">Objective</Label>
                    <Select id="objective" value={brief.objective} onChange={(e) => set("objective", e.target.value as AdCopyRequestInput["objective"])}>
                      {AD_OBJECTIVES.map((o) => <option key={o} value={o}>{title(o)}</option>)}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tone">Tone</Label>
                    <Select id="tone" value={brief.tone} onChange={(e) => set("tone", e.target.value as AdCopyRequestInput["tone"])}>
                      {AD_TONES.map((t) => <option key={t} value={t}>{title(t)}</option>)}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="variations">Variations</Label>
                    <Select id="variations" value={String(brief.variations)} onChange={(e) => set("variations", Number(e.target.value))}>
                      {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="mt-1">
                  {loading ? <Loader2 className="animate-spin" /> : variations.length ? <RefreshCw /> : <Sparkles />}
                  {loading ? "Generating…" : variations.length ? "Regenerate" : "Generate ad copy"}
                </Button>
                {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
              </form>
            </CardContent>
          </Card>

          {/* Variations */}
          <div className="flex min-w-0 flex-col gap-3">
            {loading && variations.length === 0 && (
              <div aria-busy="true" className="flex flex-col gap-3">
                {Array.from({ length: Number(brief.variations) || 3 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-xl border bg-card" />)}
              </div>
            )}
            {!loading && variations.length === 0 && (
              <EmptyState icon={Sparkles} title="No variations yet" description="Fill in the brief and generate ad copy. You can edit everything before saving." />
            )}
            {variations.length > 0 && result && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{variations.length} variations</span>
                  {result.isDemo ? (
                    <Badge variant="demo" title="Offline templates - set AI_PROVIDER to use a language model (Phase 3)">Template copy</Badge>
                  ) : (
                    <Badge variant="info">AI · {result.provider}</Badge>
                  )}
                </div>
                <Button onClick={() => setSaveOpen(true)} disabled={selectedCount === 0}>
                  <Save /> Save {selectedCount} as draft campaign
                </Button>
              </div>
            )}
            {variations.map((v, i) => (
              <Card key={v.id} className={cn("transition-shadow", previewId === v.id && "ring-2 ring-primary/30", !v.selected && "opacity-60")}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <input type="checkbox" checked={v.selected} onChange={(e) => update(v.id, { selected: e.target.checked })} className="size-4 accent-[var(--primary)]" />
                      Variation {i + 1}
                    </label>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewId(v.id)} aria-label={`Preview variation ${i + 1}`}>
                        <Eye /> Preview
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setVariations((vs) => vs.filter((x) => x.id !== v.id))} aria-label={`Remove variation ${i + 1}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between"><Label htmlFor={`h-${v.id}`}>Headline</Label><CharCount value={v.headline} limit={limits.headline} /></div>
                    <Input id={`h-${v.id}`} value={v.headline} onChange={(e) => update(v.id, { headline: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between"><Label htmlFor={`p-${v.id}`}>Primary text</Label><CharCount value={v.primaryText} limit={limits.primaryText} /></div>
                    <Textarea id={`p-${v.id}`} rows={3} value={v.primaryText} onChange={(e) => update(v.id, { primaryText: e.target.value })} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px_1fr]">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`d-${v.id}`}>Description</Label>
                      <Input id={`d-${v.id}`} value={v.description} onChange={(e) => update(v.id, { description: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`c-${v.id}`}>Call to action</Label>
                      <Select id={`c-${v.id}`} value={v.cta} onChange={(e) => update(v.id, { cta: e.target.value })}>
                        {["Get a quote", "Book a site measure", "Learn more", "Contact us", "See our work", "View projects"].map((c) => <option key={c}>{c}</option>)}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`a-${v.id}`}>Creative</Label>
                      <Select id={`a-${v.id}`} value={v.assetId ?? ""} onChange={(e) => update(v.id, { assetId: e.target.value || null })}>
                        <option value="">None</option>
                        {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Preview */}
          <div className="xl:sticky xl:top-20 xl:h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Approximate {PLATFORM_LABEL[result?.platform ?? (brief.platform as AdPlatform)]} feed layout</CardDescription>
              </CardHeader>
              <CardContent>
                {preview ? (
                  <AdPreview platform={result?.platform ?? (brief.platform as AdPlatform)} variation={preview} asset={assets.find((a) => a.id === preview.assetId)} brand={brandName} />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">Preview appears here</div>
                )}
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Saving creates a <strong>draft</strong> in this workspace only. Nothing is sent to Meta or LinkedIn.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <SaveDraftDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          defaultName={`${brief.product} – ${PLATFORM_LABEL[result?.platform ?? (brief.platform as AdPlatform)]}`}
          onSave={async (meta) => {
            if (!result) return;
            const res = await saveAdDraft({
              campaign: { ...meta, platform: result.platform, objective: brief.objective as (typeof AD_OBJECTIVES)[number], status: "DRAFT" },
              variations: variations.filter((v) => v.selected).map((v) => ({ headline: v.headline, primaryText: v.primaryText, description: v.description, cta: v.cta, assetId: v.assetId, aiGenerated: !result.isDemo })),
            });
            if (!res.ok) return res.error;
            toast("Draft campaign saved.");
            setSaveOpen(false);
            router.push(`/campaigns/${res.data!.id}`);
            return null;
          }}
        />
      </TabsContent>

      <TabsContent value="assets">
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <DemoBadge /> Placeholder creatives. Uploads and storage arrive with Phase 3.
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <AssetThumb asset={a} className="aspect-[4/3]" />
              <div className="p-3">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.kind} · {a.width}×{a.height}</p>
                <div className="mt-2 flex flex-wrap gap-1">{a.tags.map((t) => <Badge key={t} variant="neutral">{t}</Badge>)}</div>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function SaveDraftDialog({
  open,
  onOpenChange,
  defaultName,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultName: string;
  onSave: (meta: { name: string; budgetAud?: number; startDate?: string; endDate?: string }) => Promise<string | null | undefined>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Save draft campaign</DialogTitle>
        <DialogDescription>Saved as a Draft. Submit it for review from the campaign page.</DialogDescription>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            startTransition(async () => {
              const err = await onSave({
                name: String(fd.get("name") ?? ""),
                budgetAud: fd.get("budget") ? Number(fd.get("budget")) : undefined,
                startDate: String(fd.get("start") ?? "") || undefined,
                endDate: String(fd.get("end") ?? "") || undefined,
              });
              if (err) setError(err);
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="draft-name">Campaign name</Label>
            <Input id="draft-name" name="name" defaultValue={defaultName} required minLength={3} maxLength={120} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="draft-budget">Budget (AUD)</Label>
              <Input id="draft-budget" name="budget" type="number" min={0} step="1" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="draft-start">Start</Label>
              <Input id="draft-start" name="start" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="draft-end">End</Label>
              <Input id="draft-end" name="end" type="date" />
            </div>
          </div>
          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Check />} Save draft</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
