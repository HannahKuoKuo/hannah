import {
  BarChart3,
  Bot,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 1 = working now; higher numbers are planned and shown with a phase tag. */
  phase: number;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, phase: 1 },
  { href: "/campaigns", label: "Campaigns", icon: FolderKanban, phase: 1 },
  { href: "/ad-launcher", label: "Ad Launcher", icon: Megaphone, phase: 1 },
  { href: "/content-planner", label: "Content Planner", icon: CalendarDays, phase: 1 },
  { href: "/email", label: "Email Marketing", icon: Mail, phase: 4 },
  { href: "/analytics", label: "Analytics", icon: BarChart3, phase: 1 },
  { href: "/leads", label: "Lead Management", icon: Users, phase: 2 },
  { href: "/assistant", label: "AI Assistant", icon: Bot, phase: 3 },
  { href: "/settings", label: "Settings", icon: Settings, phase: 1 },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
