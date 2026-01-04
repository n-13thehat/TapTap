let inited = false

async function ensureInit() {
  if (inited) return
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  if (!dsn) return
  try {
    const Sentry = await import("@sentry/nextjs")
    Sentry.init({ dsn, tracesSampleRate: 0.0 })
    inited = true
  } catch {
    // ignore
  }
}

export async function captureException(err: unknown, context?: Record<string, unknown>) {
  try {
    await ensureInit()
    const Sentry = await import("@sentry/nextjs")
    // @ts-ignore - extra supported in SDK
    Sentry.captureException(err, { extra: context })
  } catch {}
}
