import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = new Set<string>([
  '/login',
  '/signup',
  '/onboarding',
]);

const ALLOWED_PREFIXES = [
  '/api/',
  '/_next/',
  '/static/',
  '/images/',
  '/favicon',
];

/**
 * Beta onboarding gate: any authenticated user with onboardingComplete=false
 * is redirected to /onboarding. /login, /signup, /onboarding, /api/*, and
 * static asset paths are always allowed.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'dev-only-secret',
  });

  // Not logged in: leave the request alone — protected pages can do their own
  // gate. We don't force /login here so public marketing pages still render.
  if (!token) return NextResponse.next();

  if (token.onboardingComplete === false) {
    const url = req.nextUrl.clone();
    url.pathname = '/onboarding';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every page route except API/static — those are short-circuited above
  // anyway, but excluding them here avoids the JWT lookup overhead.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
