import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export async function requireAdminUser() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user || (user.role as any) !== "ADMIN") return null;
  return user;
}
