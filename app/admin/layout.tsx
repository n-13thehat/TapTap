import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth.config";
import {
  LayoutDashboard,
  Users,
  Sword,
  BarChart3,
  Coins,
  Flag,
  Shield,
  ChevronRight,
} from "lucide-react";

const ADMIN_ROLE_ALLOWLIST = ["ADMIN", "SUPERADMIN", "OWNER", "STAFF"];
export const metadata = {
  robots: { index: false, follow: false },
};

function isAllowedRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase();
  return ADMIN_ROLE_ALLOWLIST.some((allowed) => normalized.includes(allowed));
}

const adminNavItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview and quick actions",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    description: "User management and roles",
  },
  {
    name: "Battles",
    href: "/admin/battles",
    icon: Sword,
    description: "Battle system and leagues",
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Platform metrics and insights",
  },
  {
    name: "Treasury",
    href: "/admin/trap",
    icon: Coins,
    description: "TAP token and treasury management",
  },
  {
    name: "Feature Flags",
    href: "/admin/feature-flags",
    icon: Flag,
    description: "A/B testing and rollouts",
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminRoutesAllowed =
    process.env.ALLOW_ADMIN_ROUTES === "true" ||
    process.env.NODE_ENV !== "production";
  if (!adminRoutesAllowed) {
    redirect("/");
  }

  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = session?.user?.id && isAllowedRole(role);

  if (!isAdmin) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Admin Header */}
      <header className="border-b border-red-500/30 bg-black/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">TapTap Admin</h1>
                <p className="text-sm text-red-200">Matrix Build ZION Control Center</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              Back to App
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="border-b border-white/10 bg-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {adminNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-white/70 hover:border-red-400 hover:text-white transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-white/10 bg-black/50 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between text-sm text-white/50">
            <div>
              TapTap Matrix Build ZION Admin Panel - Secure Administrative Interface
            </div>
            <div className="flex items-center gap-4">
              <span>System Status: Online</span>
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
