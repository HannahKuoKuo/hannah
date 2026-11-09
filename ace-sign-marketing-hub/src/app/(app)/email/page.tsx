import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { PlannedModule } from "@/components/layout/planned-module";

export const metadata: Metadata = { title: "Email Marketing" };

export default function EmailPage() {
  return (
    <PlannedModule
      title="Email Marketing"
      description="Newsletters, audience segments and campaign reporting."
      icon={Mail}
      phase={4}
      planned={[
        "Newsletter drafts with brand-aware AI assistance and approval",
        "Audience segmentation (data model already in the database)",
        "Subscriber CSV import with consent tracking",
        "Campaign reporting synced from the email provider",
        "Sending only after explicit confirmation",
      ]}
      requires="an email service account (e.g. MailerLite) and API key, connected with your approval"
    />
  );
}
