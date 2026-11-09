import type { AdCopyRequest } from "../validation";
import type { AIProvider, AdCopyResult, BrandContext, GeneratedAdVariation } from "./types";

const HOOKS: Record<AdCopyRequest["tone"], string[]> = {
  PROFESSIONAL: ["Make your premises work harder", "First impressions start at the street", "Signage built for business", "Be the business customers find first", "A sign that reflects your standards", "Visibility you can measure"],
  CONFIDENT: ["Get noticed. Stay noticed.", "Stop blending in", "Own your street presence", "Turn passers-by into customers", "Signage that sells while you sleep", "Make the competition look dim"],
  FRIENDLY: ["Let's get your business noticed", "Your shopfront, but better", "A little sign goes a long way", "Say hello to more walk-ins", "We'll help you stand out", "Brighten up your business"],
  TECHNICAL: ["Engineered signage, installed right", "Specified for durability", "Compliance-ready sign systems", "Low-energy LED, long service life", "Fabricated to spec, installed to code", "Materials chosen for Australian conditions"],
};

const CTA: Record<AdCopyRequest["objective"], string[]> = {
  AWARENESS: ["Learn more", "See our work"],
  TRAFFIC: ["Learn more", "View projects"],
  LEADS: ["Get a quote", "Book a site measure"],
  CONVERSIONS: ["Get a quote", "Contact us"],
};

const CLOSERS = [
  "Design, manufacture and installation handled by one team.",
  "From concept to install, we manage the whole project.",
  "Talk to our team about a solution that fits your site.",
  "Request a free consultation to get started.",
];

function sentenceCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Offline, deterministic template generator. Lets the Ad Launcher work without
 * an API key. Output is labelled as demo/template copy in the UI.
 */
export const demoProvider: AIProvider = {
  id: "demo",
  label: "Demo templates (offline)",
  async generateAdCopy(req: AdCopyRequest, brand: BrandContext): Promise<AdCopyResult> {
    const hooks = HOOKS[req.tone];
    const ctas = CTA[req.objective];
    const product = req.product.trim();
    const audience = req.audience.trim();
    const linkedin = req.platform === "LINKEDIN";

    const variations: GeneratedAdVariation[] = Array.from({ length: req.variations }, (_, i) => {
      const hook = hooks[i % hooks.length];
      const closer = CLOSERS[i % CLOSERS.length];
      const message = req.keyMessage ? ` ${sentenceCase(req.keyMessage.replace(/\.$/, ""))}.` : "";
      const primaryText = linkedin
        ? `${hook}. ${brand.name} helps ${audience.toLowerCase()} with ${product.toLowerCase()}.${message} ${closer}`
        : `${hook}! ${sentenceCase(product)} for ${audience.toLowerCase()}.${message} ${closer}`;
      return {
        headline: `${sentenceCase(product)} – ${brand.name}`.slice(0, linkedin ? 70 : 40),
        primaryText,
        description: i % 2 === 0 ? "Design · Manufacture · Install" : "Australia-wide project delivery",
        cta: ctas[i % ctas.length],
      };
    });

    return { provider: this.id, isDemo: true, variations };
  },
};
