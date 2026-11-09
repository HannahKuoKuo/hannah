import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PlannedModule } from "@/components/layout/planned-module";

export const metadata: Metadata = { title: "Lead Management" };

export default function LeadsPage() {
  return (
    <PlannedModule
      title="Lead Management"
      description="B2B prospect pipeline, company records and follow-ups."
      icon={Users}
      phase={2}
      planned={[
        "Pipeline board: New → Contacted → Qualified → Proposal → Won / Lost",
        "Company and contact records (database models already exist)",
        "Follow-up dates and reminders",
        "Lead CSV import with validation and duplicate detection",
        "Contact details redacted from logs and audit entries",
      ]}
    />
  );
}
