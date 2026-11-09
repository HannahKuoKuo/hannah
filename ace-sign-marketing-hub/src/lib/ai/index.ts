import { demoProvider } from "./demo-provider";
import { AIProviderError, type AIProvider } from "./types";

export * from "./types";

/**
 * Resolve the configured provider. Defaults to the offline demo provider.
 * Real model providers are added in Phase 3 and read keys from env only.
 */
export function getAIProvider(env: Record<string, string | undefined> = process.env): AIProvider {
  const id = (env.AI_PROVIDER ?? "demo").toLowerCase();
  switch (id) {
    case "demo":
      return demoProvider;
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) {
        throw new AIProviderError("AI_PROVIDER is 'anthropic' but ANTHROPIC_API_KEY is not set.", "not_configured");
      }
      throw new AIProviderError("The Anthropic provider is planned for Phase 3 and is not enabled yet.", "not_configured");
    default:
      throw new AIProviderError(`Unknown AI_PROVIDER '${id}'.`, "not_configured");
  }
}
