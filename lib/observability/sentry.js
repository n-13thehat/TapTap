// Sentry initialization wrapper in JS to avoid TS module resolution issues
export async function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    const release = process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
    const environment = process.env.SENTRY_ENV || process.env.NODE_ENV || 'production';
    Sentry.init({ dsn, release, environment, tracesSampleRate: 0.1 });
  } catch (e) {
    // SDK not installed or failed init. Silently ignore in runtime.
  }
}

export async function captureException(err, context) {
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(err, { extra: context });
  } catch {}
}
