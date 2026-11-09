import { Play } from "lucide-react";
import type { CreativeAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Gradient placeholder that stands in for an uploaded creative. */
export function AssetThumb({ asset, className }: { asset: CreativeAsset; className?: string }) {
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden text-white", className)}
      style={{ background: `linear-gradient(135deg, ${asset.palette[0]}, ${asset.palette[1]})` }}
      role="img"
      aria-label={`${asset.name} (placeholder)`}
    >
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_20%,white_0,transparent_45%)]" />
      <span className="relative px-3 text-center text-sm font-semibold tracking-wide drop-shadow">{asset.label}</span>
      {asset.kind === "video" && (
        <span className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5"><Play className="size-3 fill-white" /></span>
      )}
    </div>
  );
}
