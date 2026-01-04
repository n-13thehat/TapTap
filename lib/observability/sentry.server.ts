import { env, hasSentry, getSecret } from "@/lib/env";

export async function initSentry() {
  if (!hasSentry()) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    const dsn = getSecret('SENTRY_DSN');
    const release = getSecret('SENTRY_RELEASE', '') ||
                   process.env.VERCEL_GIT_COMMIT_SHA ||
                   process.env.GITHUB_SHA ||
                   'unknown';
    const environment = getSecret('SENTRY_ENV', '') || env.NODE_ENV;

    Sentry.init({
      dsn,
      release,
      environment,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event) {
        // Filter out sensitive data in production
        if (env.NODE_ENV === 'production' && event.exception) {
          // Remove potentially sensitive stack trace details
          event.exception.values?.forEach(value => {
            if (value.stacktrace?.frames) {
              value.stacktrace.frames = value.stacktrace.frames.map(frame => ({
                ...frame,
                vars: undefined, // Remove local variables
              }));
            }
          });
        }
        return event;
      }
    });

    console.log(`Sentry initialized for ${environment} environment`);
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

export async function captureException(err: unknown, context?: Record<string, unknown>) {
  try {
    const Sentry = await import("@sentry/nextjs")
    // @ts-ignore - compatible across Sentry SDKs
    Sentry.captureException(err, { extra: context })
  } catch {}
}

