import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AdLauncher } from "@/components/ad-launcher/ad-launcher";
import { Button } from "@/components/ui/button";
import { DEMO_ASSETS } from "@/lib/demo-data/assets";
import { DEFAULT_BRAND } from "@/lib/demo-data/brand";

export const metadata: Metadata = { title: "Ad Launcher" };

export default function AdLauncherPage() {
  return (
    <>
      <PageHeader
        title="Ad Launcher"
        description="Draft ad copy variations, pair them with creatives, preview, and save for approval."
        actions={
          <Button variant="outline" asChild>
            <Link href="/campaigns?status=DRAFT"><FolderOpen /> Saved drafts</Link>
          </Button>
        }
      />
      <AdLauncher assets={DEMO_ASSETS} brandName={DEFAULT_BRAND.name} />
    </>
  );
}
