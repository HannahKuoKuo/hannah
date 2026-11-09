import type { Metadata } from "next";
import { Bot } from "lucide-react";
import { PlannedModule } from "@/components/layout/planned-module";

export const metadata: Metadata = { title: "AI Assistant" };

export default function AssistantPage() {
  return (
    <PlannedModule
      title="AI Assistant"
      description="Brand-aware content creation, summaries and recommendations."
      icon={Bot}
      phase={3}
      planned={[
        "Chat grounded in the brand guidelines and campaign data",
        "Performance summaries for a chosen date range",
        "Recommendations, always shown as suggestions for a person to review",
        "Pluggable provider: offline demo templates today, a language model once an API key is configured",
      ]}
      requires="ANTHROPIC_API_KEY (or another provider key) in .env.local"
    />
  );
}
