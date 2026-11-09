import { Badge, type BadgeProps } from "./badge";
import { STATUS_LABEL, type ApprovalStatus, type CampaignStatus } from "@/lib/types";

const APPROVAL_VARIANT: Record<ApprovalStatus, BadgeProps["variant"]> = {
  DRAFT: "neutral",
  IN_REVIEW: "warning",
  CHANGES_REQUESTED: "danger",
  APPROVED: "success",
  SCHEDULED: "info",
  PUBLISHED: "violet",
};

const CAMPAIGN_VARIANT: Record<CampaignStatus, BadgeProps["variant"]> = {
  DRAFT: "neutral",
  IN_REVIEW: "warning",
  APPROVED: "success",
  ACTIVE: "success",
  PAUSED: "neutral",
  COMPLETED: "violet",
};

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return <Badge variant={APPROVAL_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
  return <Badge variant={CAMPAIGN_VARIANT[status]}>{label}</Badge>;
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge variant="demo" className={className} title="Synthetic demo data – not from a connected account">
      Demo data
    </Badge>
  );
}
