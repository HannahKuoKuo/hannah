import type { AdCopyRequest } from "../validation";

export interface GeneratedAdVariation {
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
}

export interface AdCopyResult {
  provider: string;
  /** true when output came from offline templates rather than a language model */
  isDemo: boolean;
  variations: GeneratedAdVariation[];
}

export interface BrandContext {
  name: string;
  voice: string;
  doList: string[];
  dontList: string[];
}

export interface AIProvider {
  readonly id: string;
  readonly label: string;
  generateAdCopy(req: AdCopyRequest, brand: BrandContext): Promise<AdCopyResult>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "not_configured" | "provider_error" | "invalid_output",
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
