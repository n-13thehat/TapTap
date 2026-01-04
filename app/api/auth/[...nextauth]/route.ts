import NextAuth from "@/auth.config";

// Export NextAuth handlers for Next.js App Router (v4 compatibility)
const handler = NextAuth;

export { handler as GET, handler as POST };
