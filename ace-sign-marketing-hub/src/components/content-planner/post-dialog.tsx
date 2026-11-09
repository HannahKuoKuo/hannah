"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Save, Send, Trash2, Undo2, X, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { ApprovalBadge, DemoBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toaster";
import { PLATFORM_LABEL, SOCIAL_PLATFORMS, type ApprovalStatus, type SocialPlatform } from "@/lib/types";
import { contentPostSchema } from "@/lib/validation";
import { fromBusinessLocal, toBusinessLocal } from "@/lib/time";
import { createPost, deletePost, setPostStatus, updatePost } from "@/server/actions/content";
import type { StoredPost } from "@/server/queries";

const LIMITS: Record<SocialPlatform, number> = { FACEBOOK: 63206, INSTAGRAM: 2200, LINKEDIN: 3000 };

export function PostDialog({
  open,
  onOpenChange,
  post,
  defaultDate,
  canApprove,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  post: StoredPost | null;
  defaultDate: string;
  canApprove: boolean;
}) {
  const [platform, setPlatform] = useState<SocialPlatform>(post?.platform ?? "LINKEDIN");
  const [body, setBody] = useState(post?.body ?? "");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const locked = post?.status === "PUBLISHED";

  function changeStatus(status: ApprovalStatus) {
    if (!post) return;
    startTransition(async () => {
      const res = await setPostStatus(post.id, { status, note: note || undefined });
      if (!res.ok) setFormError(res.error);
      else {
        toast("Status updated.");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {post ? "Edit post" : "New post"}
          {post && <ApprovalBadge status={post.status} />}
          {post?.source === "DEMO" && <DemoBadge />}
        </DialogTitle>
        <DialogDescription>
          {post ? `By ${post.author}. Times are Sydney time.` : "Creates a draft. Times are Sydney time. Nothing is posted to social accounts."}
        </DialogDescription>

        {post?.status === "CHANGES_REQUESTED" && post.reviewNote && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"><strong>Reviewer:</strong> {post.reviewNote}</p>
        )}

        <form
          noValidate
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const local = String(fd.get("scheduledAt") ?? "");
            const input = {
              title: String(fd.get("title") ?? ""),
              body,
              platform,
              scheduledAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ? fromBusinessLocal(local).toISOString() : "",
            };
            const check = contentPostSchema.safeParse(input);
            if (!check.success) {
              setErrors(check.error.flatten().fieldErrors);
              return;
            }
            setErrors({});
            setFormError(null);
            startTransition(async () => {
              const res = post ? await updatePost(post.id, input) : await createPost(input);
              if (!res.ok) {
                setFormError(res.error);
                if (res.fieldErrors) setErrors(res.fieldErrors);
                return;
              }
              toast(res.message ?? "Saved.");
              onOpenChange(false);
            });
          }}
        >
          <fieldset disabled={locked || pending} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="post-title">Title (internal)</Label>
              <Input id="post-title" name="title" defaultValue={post?.title} aria-invalid={!!errors.title} />
              <FieldError>{errors.title?.[0]}</FieldError>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-platform">Platform</Label>
                <Select id="post-platform" value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatform)}>
                  {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-when">Scheduled for</Label>
                <Input id="post-when" name="scheduledAt" type="datetime-local" defaultValue={post ? toBusinessLocal(post.scheduledAt) : `${defaultDate}T09:00`} aria-invalid={!!errors.scheduledAt} />
                <FieldError>{errors.scheduledAt?.[0]}</FieldError>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <Label htmlFor="post-body">Post copy</Label>
                <span className={`text-[11px] tabular-nums ${body.length > LIMITS[platform] ? "text-red-600" : "text-muted-foreground"}`}>{body.length}/{LIMITS[platform]}</span>
              </div>
              <Textarea id="post-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={!!errors.body} />
              <FieldError>{errors.body?.[0]}</FieldError>
            </div>
          </fieldset>

          {post && post.status === "IN_REVIEW" && canApprove && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="review-note">Review note <span className="font-normal text-muted-foreground">(required to request changes)</span></Label>
              <Input id="review-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </div>
          )}

          {formError && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>}

          <div className="mt-1 flex flex-wrap items-center gap-2 border-t pt-4">
            {post && !locked && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-700"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Delete this post? This cannot be undone.")) return;
                  startTransition(async () => {
                    const res = await deletePost(post.id);
                    if (!res.ok) setFormError(res.error);
                    else {
                      toast("Post deleted.");
                      onOpenChange(false);
                    }
                  });
                }}
              >
                <Trash2 /> Delete
              </Button>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              {post?.status === "DRAFT" || post?.status === "CHANGES_REQUESTED" ? (
                <Button type="button" variant="outline" disabled={pending} onClick={() => changeStatus("IN_REVIEW")}><Send /> Submit for review</Button>
              ) : null}
              {post?.status === "IN_REVIEW" && canApprove && (
                <>
                  <Button type="button" variant="outline" disabled={pending} onClick={() => changeStatus("CHANGES_REQUESTED")}><X /> Request changes</Button>
                  <Button type="button" variant="success" disabled={pending} onClick={() => changeStatus("APPROVED")}><Check /> Approve</Button>
                </>
              )}
              {post?.status === "APPROVED" && canApprove && (
                <Button type="button" variant="outline" disabled={pending} onClick={() => changeStatus("SCHEDULED")} title="Marks it ready to post. Auto-posting requires Phase 4 integrations.">
                  <CalendarClock /> Mark scheduled
                </Button>
              )}
              {(post?.status === "SCHEDULED" || post?.status === "APPROVED") && canApprove && (
                <Button type="button" variant="ghost" disabled={pending} onClick={() => changeStatus("DRAFT")}><Undo2 /> Back to draft</Button>
              )}
              {!locked && (
                <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} {post ? "Save" : "Create draft"}</Button>
              )}
            </div>
          </div>
          {post && (post.status === "APPROVED" || post.status === "SCHEDULED") && (
            <p className="text-[11px] text-muted-foreground">Editing approved content returns it to Draft for re-approval.</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
