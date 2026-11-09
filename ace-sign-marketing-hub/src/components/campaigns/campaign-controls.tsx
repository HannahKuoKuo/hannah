"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Rocket, Send, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApprovalBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { AdPreview } from "@/components/ad-launcher/ad-preview";
import { DEMO_ASSETS } from "@/lib/demo-data/assets";
import type { AdVariation, ApprovalStatus, Platform } from "@/lib/types";
import type { CampaignInput } from "@/lib/validation";
import { deleteCampaign, deleteVariation, requestPublish, setVariationStatus, updateCampaign } from "@/server/actions/campaigns";
import { CampaignForm } from "./campaign-form";

export function EditCampaign({ id, initial }: { id: string; initial: CampaignInput }) {
  return (
    <CampaignForm
      initial={initial}
      submitLabel="Save changes"
      onSubmit={async (input) => {
        const res = await updateCampaign(id, input);
        if (res.ok) toast(res.message ?? "Saved.");
        return res;
      }}
    />
  );
}

export function DeleteCampaignButton({ id, name, metricRows }: { id: string; name: string; metricRows: number }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={<Button variant="outline" className="text-red-700"><Trash2 /> Delete</Button>}
      title="Delete campaign?"
      description={
        <>
          <strong>{name}</strong> and its ad variations will be permanently deleted
          {metricRows > 0 && <>, along with <strong>{metricRows}</strong> daily metric rows</>}. This cannot be undone.
        </>
      }
      confirmLabel="Delete campaign"
      onConfirm={async () => {
        const res = await deleteCampaign(id);
        if (!res.ok) return res.error;
        toast("Campaign deleted.");
        router.push("/campaigns");
      }}
    />
  );
}

export function PublishButton({ id, platform, approved }: { id: string; platform: string; approved: number }) {
  return (
    <ConfirmDialog
      trigger={<Button disabled={approved === 0} title={approved === 0 ? "Approve at least one variation first" : undefined}><Rocket /> Publish…</Button>}
      title={`Publish to ${platform}?`}
      variant="default"
      description={
        <div className="space-y-2">
          <p>This would send {approved} approved variation(s) to {platform} as a live campaign and may start spending budget.</p>
          <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
            No ad platform is connected, so publishing is <strong>blocked</strong>. The attempt is recorded in the audit log and nothing is sent.
          </p>
        </div>
      }
      confirmLabel="Publish"
      onConfirm={async () => {
        const res = await requestPublish(id);
        if (!res.ok) toast(res.error, "error");
      }}
    />
  );
}

type Variation = AdVariation & { assetId: string | null };

const ACTIONS: { to: ApprovalStatus; label: string; icon: typeof Check; variant: "success" | "outline" | "default"; from: ApprovalStatus[] }[] = [
  { to: "IN_REVIEW", label: "Submit for review", icon: Send, variant: "default", from: ["DRAFT", "CHANGES_REQUESTED"] },
  { to: "APPROVED", label: "Approve", icon: Check, variant: "success", from: ["IN_REVIEW"] },
  { to: "CHANGES_REQUESTED", label: "Request changes", icon: X, variant: "outline", from: ["IN_REVIEW"] },
  { to: "DRAFT", label: "Back to draft", icon: Undo2, variant: "outline", from: ["IN_REVIEW", "APPROVED", "CHANGES_REQUESTED"] },
];

export function VariationCard({ v, index, platform, brand, canApprove }: { v: Variation; index: number; platform: Platform; brand: string; canApprove: boolean }) {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast(res.error ?? "Action failed.", "error");
      else if (success) toast(success);
    });
  const previewPlatform = platform === "INSTAGRAM" || platform === "LINKEDIN" ? platform : "FACEBOOK";
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Variation {index + 1}</span>
            <ApprovalBadge status={v.status} />
            {v.aiGenerated && <Badge variant="neutral">AI-assisted</Badge>}
            {pending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
          </div>
          <p className="font-medium">{v.headline}</p>
          <p className="text-sm text-muted-foreground">{v.primaryText}</p>
          <p className="text-xs text-muted-foreground">{v.description} · CTA: {v.cta}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {ACTIONS.filter((a) => a.from.includes(v.status)).map((a) => {
              const needsApprove = a.to === "APPROVED" || a.to === "CHANGES_REQUESTED";
              const Icon = a.icon;
              return (
                <Button
                  key={a.to}
                  size="sm"
                  variant={a.variant}
                  disabled={pending || (needsApprove && !canApprove)}
                  title={needsApprove && !canApprove ? "Your role cannot approve ads" : undefined}
                  onClick={() => run(() => setVariationStatus(v.id, a.to), `Marked ${a.label.toLowerCase()}.`)}
                >
                  <Icon /> {a.label}
                </Button>
              );
            })}
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => deleteVariation(v.id), "Variation removed.")} aria-label={`Delete variation ${index + 1}`}>
              <Trash2 />
            </Button>
          </div>
        </div>
        <AdPreview platform={previewPlatform} variation={v} asset={DEMO_ASSETS.find((a) => a.id === v.assetId)} brand={brand} />
      </CardContent>
    </Card>
  );
}
