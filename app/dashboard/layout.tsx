// Passthrough layout. Chrome (sidebar, header, mobile bar) is owned by the
// root <AppShell>. Nav items previously hard-coded here now live in
// config/navigation.ts and are filtered by role automatically.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
