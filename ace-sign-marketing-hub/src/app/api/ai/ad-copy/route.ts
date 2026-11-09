import { NextResponse } from "next/server";
import { AIProviderError, getAIProvider } from "@/lib/ai";
import { recordAudit } from "@/server/audit";
import { PermissionError, requirePermission } from "@/server/session";
import { DEFAULT_BRAND } from "@/lib/demo-data/brand";
import { adCopyRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let user;
  try {
    user = await requirePermission("ads:create");
  } catch (e) {
    return NextResponse.json({ error: e instanceof PermissionError ? e.message : "Could not verify your session." }, { status: e instanceof PermissionError ? 403 : 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = adCopyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the brief.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const provider = getAIProvider();
    const result = await provider.generateAdCopy(parsed.data, DEFAULT_BRAND);
    await recordAudit({
      actorId: user.id,
      action: "ad.generate",
      entityType: "ad_copy",
      metadata: { provider: result.provider, platform: parsed.data.platform, count: result.variations.length },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    }
    // Log only the error type - never the brief, which may contain customer details.
    console.error("ad-copy generation failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
