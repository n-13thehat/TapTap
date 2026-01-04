"use client";

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    (async () => {
      try {
        const mod = await import('../lib/observability/sentry.client');
        await mod.captureException?.(error, { digest: error.digest });
      } catch {}
    })();
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 16 }}>
          <h2>Something went wrong</h2>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
