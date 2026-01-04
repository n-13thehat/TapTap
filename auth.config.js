import NextAuth, { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma.js";
import bcrypt from "bcryptjs";

// Safe environment access for build time
const getEnvVar = (key, fallback = '') => {
  try {
    return process.env[key] || fallback;
  } catch {
    return fallback;
  }
};

const hasGoogleOAuth = () => !!(getEnvVar('GOOGLE_CLIENT_ID') && getEnvVar('GOOGLE_CLIENT_SECRET'));
const hasAppleOAuth = () => !!(getEnvVar('APPLE_ID') && getEnvVar('APPLE_SECRET'));
const getSecret = (key, fallback = '') => getEnvVar(key, fallback);

// Simplified rate limiting using in-memory storage only
// TODO: Re-enable Redis when dependency issues are resolved
const credentialAttempts = new Map();
const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

async function incrementCredentialAttempts(key) {
  const now = Date.now();
  const existing = credentialAttempts.get(key);
  if (!existing || existing.resetAt < now) {
    credentialAttempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return 1;
  }
  const next = { count: existing.count + 1, resetAt: existing.resetAt };
  credentialAttempts.set(key, next);
  return next.count;
}

function isRateLimitedLocal(key) {
  const now = Date.now();
  const existing = credentialAttempts.get(key);
  if (!existing) return false;
  if (existing.resetAt < now) {
    credentialAttempts.delete(key);
    return false;
  }
  return existing.count >= ATTEMPT_LIMIT;
}

function requireSecret(key) {
  const value = getSecret(key);
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${key} is required for auth`);
  }
  // Provide a deterministic fallback for local/test to avoid startup failures
  return 'dev-only-secret';
}

// Create NextAuth configuration
const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: requireSecret('NEXTAUTH_SECRET'),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? "");
        const password = (credentials?.password ?? "");
        const limiterKey = email || "unknown";
        if (isRateLimitedLocal(limiterKey)) {
          throw new Error("Too many attempts. Please try again later.");
        }
        const attempts = await incrementCredentialAttempts(limiterKey);
        if (attempts > ATTEMPT_LIMIT) {
          throw new Error("Too many attempts. Please try again later.");
        }
        const genericError = "Invalid credentials";
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error(genericError);
        const hashed = user.hashedPassword || "";
        const valid = hashed && password ? await bcrypt.compare(password, hashed) : false;
        if (!valid) throw new Error(genericError);
        if (getEnvVar('BETA_MODE') === 'true' && user.inviteCode !== getSecret('BETA_ACCESS_CODE', ''))
          throw new Error("Invite-only beta. Invalid access code.");
        if (!user.hasTapPass) throw new Error("TapPass required to join TapTap Beta.");
        return user;
      },
    }),
    // Optional Google OAuth provider (enabled only if env present)
    ...(hasGoogleOAuth()
      ? [GoogleProvider({
          clientId: getSecret('GOOGLE_CLIENT_ID'),
          clientSecret: getSecret('GOOGLE_CLIENT_SECRET'),
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code"
            }
          }
        })]
      : []),

    // Apple Sign In (iOS App Store requirement)
    ...(hasAppleOAuth()
      ? [AppleProvider({
          clientId: getSecret('APPLE_ID'),
          clientSecret: getSecret('APPLE_SECRET'),
          authorization: {
            params: {
              scope: "name email",
              response_mode: "form_post"
            }
          }
        })]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const u = user;
        token.id = u.id;
        token.role = u.role || "LISTENER";
        token.username = u.username || null;
        token.walletAddress = u.walletAddress || null;
        token.twoFactorEnabled = u.twoFactorEnabled || false;
        token.creatorMode = u.creatorMode || false;
      }

      // Store provider info for wallet connections
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.walletAddress = token.walletAddress;
        session.user.twoFactorEnabled = token.twoFactorEnabled;
        session.user.creatorMode = token.creatorMode;
        session.user.provider = token.provider;
        session.user.providerAccountId = token.providerAccountId;
      }
      return session;
    },
  },
  // pages: {
  //   signIn: '/auth/signin',
  //   error: '/auth/error',
  // },
};

// Initialize NextAuth for v4
const handler = NextAuth(authConfig);

console.log('✅ NextAuth initialized (local-first, Supabase optional)');

// Default export for route handlers
export default handler;

// Explicit handlers for App Router
export const handlers = handler;
export const GET = handler;
export const POST = handler;

// Server-side session helper (works in RSC, route handlers, and actions)
export const auth = (...args) => {
  if (args.length === 0) {
    return getServerSession(authConfig);
  }
  return getServerSession(...args, authConfig);
};
