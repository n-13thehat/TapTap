'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      if (result?.error) {
        setError(result.error || 'Invalid credentials');
        setSubmitting(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-black/70 border border-white/10 rounded-2xl p-8 backdrop-blur">
      <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
      <p className="text-white/60 mb-6">Log in to your TapTap account.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 transition disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        New to TapTap?{' '}
        <Link href="/signup" className="text-teal-400 hover:text-teal-300">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-white/60">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
