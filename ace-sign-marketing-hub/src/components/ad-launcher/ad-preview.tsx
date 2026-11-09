import { Globe, MoreHorizontal, ThumbsUp, MessageCircle, Share2, Heart, Send, Bookmark } from "lucide-react";
import type { AdVariation, CreativeAsset } from "@/lib/types";
import type { AD_PLATFORMS } from "@/lib/validation";
import { AssetThumb } from "./asset-thumb";

type AdPlatform = (typeof AD_PLATFORMS)[number];

/** Approximate feed mock-up. Final rendering is controlled by each platform. */
export function AdPreview({ platform, variation, asset, brand }: { platform: AdPlatform; variation: AdVariation; asset?: CreativeAsset; brand: string }) {
  const header = (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2f6fed] to-[#1b3f9e] text-xs font-bold text-white">A</div>
      <div className="flex-1 leading-tight">
        <p className="text-xs font-semibold">{brand}</p>
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {platform === "LINKEDIN" ? "Promoted" : "Sponsored"} <Globe className="size-2.5" />
        </p>
      </div>
      <MoreHorizontal className="size-4 text-muted-foreground" />
    </div>
  );
  const media = asset ? (
    <AssetThumb asset={asset} className={platform === "INSTAGRAM" ? "aspect-square" : "aspect-[1.91/1]"} />
  ) : (
    <div className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${platform === "INSTAGRAM" ? "aspect-square" : "aspect-[1.91/1]"}`}>
      Select a creative
    </div>
  );

  if (platform === "INSTAGRAM") {
    return (
      <div className="overflow-hidden rounded-lg border bg-white text-slate-900">
        {header}
        {media}
        <div className="flex items-center justify-between border-b px-3 py-2 text-xs font-semibold">
          {variation.cta} <span aria-hidden>›</span>
        </div>
        <div className="flex gap-3 px-3 pt-2 text-slate-700"><Heart className="size-4" /><MessageCircle className="size-4" /><Send className="size-4" /><Bookmark className="ml-auto size-4" /></div>
        <p className="px-3 pb-3 pt-1.5 text-xs leading-relaxed"><span className="font-semibold">{brand.toLowerCase().replace(/\s+/g, "")}</span> {variation.primaryText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white text-slate-900">
      {header}
      <p className="px-3 pb-2 text-xs leading-relaxed">{variation.primaryText}</p>
      {media}
      <div className="flex items-center gap-3 bg-slate-50 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{variation.headline}</p>
          <p className="truncate text-[11px] text-muted-foreground">{variation.description}</p>
        </div>
        <span className="shrink-0 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold">{variation.cta}</span>
      </div>
      <div className="flex justify-around border-t py-1.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><ThumbsUp className="size-3" /> Like</span>
        <span className="flex items-center gap-1"><MessageCircle className="size-3" /> Comment</span>
        <span className="flex items-center gap-1"><Share2 className="size-3" /> Share</span>
      </div>
    </div>
  );
}
