import {
  Boxes,
  Calculator,
  FlaskConical,
  GitCompare,
  LayoutDashboard,
  ServerCog,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_GROUPS: readonly { label: string; items: readonly NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/models", label: "Models", icon: Boxes },
      { href: "/compare", label: "Compare", icon: GitCompare },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Ecosystem",
    items: [
      { href: "/labs", label: "Labs", icon: FlaskConical },
      { href: "/providers", label: "Providers", icon: ServerCog },
    ],
  },
  {
    label: "Tools",
    items: [{ href: "/calculator", label: "Cost calculator", icon: Calculator }],
  },
];
