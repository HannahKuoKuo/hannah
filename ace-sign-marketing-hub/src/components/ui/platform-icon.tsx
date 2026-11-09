import { AtSign, Briefcase, Camera, Mail, Search, type LucideIcon } from "lucide-react";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

// Generic icons (not brand marks) keep the UI neutral and licence-safe.
const ICONS: Record<Platform, { icon: LucideIcon; className: string }> = {
  FACEBOOK: { icon: AtSign, className: "bg-blue-50 text-blue-700" },
  INSTAGRAM: { icon: Camera, className: "bg-pink-50 text-pink-700" },
  LINKEDIN: { icon: Briefcase, className: "bg-sky-50 text-sky-800" },
  GOOGLE: { icon: Search, className: "bg-emerald-50 text-emerald-700" },
  EMAIL: { icon: Mail, className: "bg-slate-100 text-slate-700" },
};

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const { icon: Icon, className: tone } = ICONS[platform];
  return (
    <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md", tone, className)}>
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

export const PLATFORM_DOT: Record<Platform, string> = {
  FACEBOOK: "bg-blue-600",
  INSTAGRAM: "bg-pink-500",
  LINKEDIN: "bg-sky-700",
  GOOGLE: "bg-emerald-600",
  EMAIL: "bg-slate-500",
};
