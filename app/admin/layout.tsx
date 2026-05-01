import { redirect } from "next/navigation";
import { auth } from "@/auth.config";

const ADMIN_ROLE_ALLOWLIST = ["ADMIN", "SUPERADMIN", "OWNER", "STAFF"];
export const metadata = {
  robots: { index: false, follow: false },
};

function isAllowedRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase();
  return ADMIN_ROLE_ALLOWLIST.some((allowed) => normalized.includes(allowed));
}

// Server-side auth gate. The visual chrome (red admin sidebar + header) is
// owned by the root <AppShell>, which auto-detects the admin variant from the
// /admin/* path. This layout only enforces the role check.
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

  return <>{children}</>;
}
