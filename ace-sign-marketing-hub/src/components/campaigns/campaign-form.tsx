"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { PLATFORM_LABEL, PLATFORMS } from "@/lib/types";
import { AD_OBJECTIVES, CAMPAIGN_STATUSES, campaignSchema, type CampaignInput } from "@/lib/validation";
import type { ActionResult } from "@/server/actions/result";

const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ");

export function CampaignForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  initial?: Partial<CampaignInput>;
  submitLabel?: string;
  onSubmit: (input: CampaignInput) => Promise<ActionResult<unknown>>;
  onCancel?: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      noValidate
      className="@container flex flex-col gap-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const input = {
          name: String(fd.get("name") ?? ""),
          platform: String(fd.get("platform")) as CampaignInput["platform"],
          objective: String(fd.get("objective")) as CampaignInput["objective"],
          status: String(fd.get("status")) as CampaignInput["status"],
          budgetAud: String(fd.get("budgetAud") ?? ""),
          startDate: String(fd.get("startDate") ?? ""),
          endDate: String(fd.get("endDate") ?? ""),
          notes: String(fd.get("notes") ?? ""),
        };
        const check = campaignSchema.safeParse(input);
        if (!check.success) {
          setErrors(check.error.flatten().fieldErrors);
          return;
        }
        setErrors({});
        setFormError(null);
        startTransition(async () => {
          const res = await onSubmit(input);
          if (!res.ok) {
            setFormError(res.error);
            if (res.fieldErrors) setErrors(res.fieldErrors);
          }
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-name">Campaign name</Label>
        <Input id="c-name" name="name" defaultValue={initial?.name} aria-invalid={!!errors.name} />
        <FieldError>{errors.name?.[0]}</FieldError>
      </div>
      <div className="grid gap-3 @md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-platform">Platform</Label>
          <Select id="c-platform" name="platform" defaultValue={initial?.platform ?? "FACEBOOK"}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-objective">Objective</Label>
          <Select id="c-objective" name="objective" defaultValue={initial?.objective ?? "LEADS"}>
            {AD_OBJECTIVES.map((o) => <option key={o} value={o}>{title(o)}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-status">Status</Label>
          <Select id="c-status" name="status" defaultValue={initial?.status ?? "DRAFT"}>
            {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{title(s)}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 @md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-budget">Budget (AUD)</Label>
          <Input id="c-budget" name="budgetAud" type="number" min={0} step="0.01" defaultValue={initial?.budgetAud as number | undefined} aria-invalid={!!errors.budgetAud} />
          <FieldError>{errors.budgetAud?.[0]}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-start">Start date</Label>
          <Input id="c-start" name="startDate" type="date" defaultValue={initial?.startDate} aria-invalid={!!errors.startDate} />
          <FieldError>{errors.startDate?.[0]}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-end">End date</Label>
          <Input id="c-end" name="endDate" type="date" defaultValue={initial?.endDate} aria-invalid={!!errors.endDate} />
          <FieldError>{errors.endDate?.[0]}</FieldError>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-notes">Notes</Label>
        <Textarea id="c-notes" name="notes" rows={3} defaultValue={initial?.notes} />
      </div>
      {formError && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} {submitLabel}</Button>
      </div>
    </form>
  );
}
