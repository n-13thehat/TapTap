'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: username || undefined,
          inviteCode: inviteCode || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Signup failed.');
        setSubmitting(false);
        return;
      }
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      if (result?.error) {
        setError('Account created, but sign-in failed. Please try logging in.');
        setSubmitting(false);
        return;
      }
      router.push('/onboarding');
    } catch (err: any) {
      setError(err?.message || 'Signup failed.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-black/70 border border-white/10 rounded-2xl p-8 backdrop-blur">
        <h1 className="text-3xl font-bold text-white mb-2">Join the TapTap Beta</h1>
        <p className="text-white/60 mb-6">Create your account to get started.</p>

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
            <label className="block text-sm text-white/70 mb-1" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="mt-1 text-xs text-white/40">At least 8 characters.</p>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1" htmlFor="inviteCode">Invite code</label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="mt-1 text-xs text-white/40">Required during closed beta.</p>
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
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-400 hover:text-teal-300">Log in</Link>
        </p>
      </div>
    </div>
  );
}
