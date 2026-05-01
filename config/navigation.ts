import {
  Home,
  Users,
  Library,
  Mic2,
  Upload,
  Zap,
  Music,
  Swords,
  Waves,
  Radio,
  MessageSquare,
  Compass,
  Telescope,
  ShoppingCart,
  Bot,
  Wallet as WalletIcon,
  Settings,
  Terminal,
  Disc,
  Cpu,
  ScanLine,
  Palette,
  LayoutDashboard,
  BarChart3,
  Coins,
  Crown,
  Hammer,
  Flag,
  Shield,
  type LucideIcon,
} from "lucide-react";

export type NavRole = "public" | "auth" | "creator" | "admin";

export type NavCategory =
  | "main"
  | "physical"
  | "create"
  | "play"
  | "social"
  | "discover"
  | "account";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  category: NavCategory;
  description?: string;
  role?: NavRole;
  badge?: string;
}

export const CATEGORY_LABELS: Record<NavCategory, string> = {
  main: "Main",
  physical: "Physical",
  create: "Create",
  play: "Play",
  social: "Social",
  discover: "Discover",
  account: "Account",
};

export const MAIN_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home, category: "main", description: "Your hub" },
  { href: "/social", label: "Social", icon: Users, category: "main", description: "Feed & friends" },
  { href: "/library", label: "Library", icon: Library, category: "main", description: "Your music vault" },

  { href: "/trap", label: "The Trap", icon: ScanLine, category: "physical", description: "Order NFC chips", role: "creator", badge: "NEW" },
  { href: "/art", label: "Visual Art", icon: Palette, category: "physical", description: "Bind art to chips", role: "creator", badge: "NEW" },

  { href: "/creator", label: "Creator Hub", icon: Mic2, category: "create", description: "Build your sound", role: "creator" },
  { href: "/upload", label: "Upload", icon: Upload, category: "create", description: "Push tracks live", role: "creator" },
  { href: "/posterize", label: "Posterize", icon: Zap, category: "create", description: "Visual templates", role: "creator" },

  { href: "/stemstation", label: "STEMSTATION", icon: Music, category: "play", description: "Rhythm gaming" },
  { href: "/battles", label: "Battles", icon: Swords, category: "play", description: "Compete & vote" },
  { href: "/surf", label: "Surf", icon: Waves, category: "play", description: "Ride the waves" },

  { href: "/live", label: "Live", icon: Radio, category: "social", description: "Streams & rooms" },
  { href: "/dm", label: "Messages", icon: MessageSquare, category: "social", description: "DMs & groups", role: "auth" },

  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart, category: "discover", description: "Trade & discover" },
  { href: "/explore", label: "Explore", icon: Compass, category: "discover", description: "New worlds" },
  { href: "/astro", label: "Astro", icon: Telescope, category: "discover", description: "Astrology layer" },
  { href: "/ai", label: "AI", icon: Bot, category: "discover", description: "Hope, Muse & co." },
  { href: "/mainframe", label: "Mainframe", icon: Disc, category: "discover", description: "Core systems" },

  { href: "/wallet", label: "Wallet", icon: WalletIcon, category: "account", description: "Tokens & assets", role: "auth" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, category: "account", description: "Your stats", role: "auth" },
  { href: "/settings", label: "Settings", icon: Settings, category: "account", description: "Preferences", role: "auth" },
];

// 5-tab mobile bottom-bar. The 5th slot is "More" (rendered by AppShell).
export const MAIN_TABS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home, category: "main" },
  { href: "/library", label: "Library", icon: Library, category: "main" },
  { href: "/trap", label: "Trap", icon: ScanLine, category: "physical" },
  { href: "/battles", label: "Battles", icon: Swords, category: "play" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, category: "main", role: "admin" },
  { href: "/admin/users", label: "Users", icon: Users, category: "main", role: "admin" },
  { href: "/admin/battles", label: "Battles", icon: Swords, category: "play", role: "admin" },
  { href: "/admin/encoder", label: "Encoder", icon: Cpu, category: "physical", role: "admin", badge: "NEW" },
  { href: "/admin/trap", label: "Treasury", icon: Coins, category: "account", role: "admin" },
  { href: "/admin/economy", label: "Economy", icon: Crown, category: "account", role: "admin" },
  { href: "/admin/forge", label: "Token Forge", icon: Hammer, category: "create", role: "admin" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, category: "discover", role: "admin" },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag, category: "discover", role: "admin" },
];

export interface ViewerCapabilities {
  isAuthenticated: boolean;
  isCreator: boolean;
  isAdmin: boolean;
}

export function canSeeNavItem(item: NavItem, viewer: ViewerCapabilities): boolean {
  switch (item.role) {
    case "admin":
      return viewer.isAdmin;
    case "creator":
      return viewer.isCreator || viewer.isAdmin;
    case "auth":
      return viewer.isAuthenticated;
    case "public":
    case undefined:
      return true;
  }
}

export function filterNav(items: NavItem[], viewer: ViewerCapabilities): NavItem[] {
  return items.filter((i) => canSeeNavItem(i, viewer));
}

export function groupByCategory(items: NavItem[]): Array<{ category: NavCategory; items: NavItem[] }> {
  const order: NavCategory[] = ["main", "physical", "create", "play", "social", "discover", "account"];
  const buckets = new Map<NavCategory, NavItem[]>();
  for (const item of items) {
    const arr = buckets.get(item.category) ?? [];
    arr.push(item);
    buckets.set(item.category, arr);
  }
  return order
    .filter((c) => buckets.has(c))
    .map((category) => ({ category, items: buckets.get(category)! }));
}

export const ADMIN_HOME_HREF = "/admin";
export const APP_HOME_HREF = "/home";
export const PUBLIC_LANDING_HREF = "/";

export { Shield };
