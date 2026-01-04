"use client"

import * as React from "react"
import { signIn, signOut, useSession } from "next-auth/react"

export default function AuthGate() {
  const { data: session, status } = useSession()

  const [mode, setMode] = React.useState<"signin" | "signup">("signin")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // shared fields
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  // signup extras
  const [name, setName] = React.useState("")
  const [inviteCode, setInviteCode] = React.useState("")
  const [walletAddress, setWalletAddress] = React.useState("")

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })
      if (res?.error) setError(res.error)
    } catch (err: any) {
      setError(err?.message || "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode, walletAddress }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || "Sign up failed")
      await signIn("credentials", { redirect: false, email, password })
    } catch (err: any) {
      setError(err?.message || "Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-teal-400/20 bg-black/60 p-5 text-left shadow-[0_0_30px_#00ffd160] backdrop-blur-md">
      {status === "loading" ? (
        <div className="text-center text-sm text-teal-200/80">Checking session…</div>
      ) : session?.user ? (
        <div className="space-y-4">
          <div>
            <div className="text-sm text-teal-300/80">Signed in as</div>
            <div className="text-lg font-semibold">{session.user.email || (session.user as any)?.username || "User"}</div>
          </div>
          <button
            className="w-full rounded-md bg-teal-500 px-3 py-2 text-sm font-medium text-black hover:bg-teal-400"
            onClick={() => signOut({ redirect: false })}
          >
            Sign out
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex gap-2">
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm ${mode === "signin" ? "bg-teal-500 text-black" : "bg-teal-900/40 text-teal-100/80"}`}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm ${mode === "signup" ? "bg-teal-500 text-black" : "bg-teal-900/40 text-teal-100/80"}`}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          {error ? (
            <div className="mb-3 rounded-md border border-red-400/40 bg-red-900/20 p-2 text-xs text-red-300">{error}</div>
          ) : null}

          {mode === "signin" ? (
            <form onSubmit={onSignIn} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-teal-400/20 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-teal-200/40"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-teal-400/20 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-teal-200/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-teal-500 px-3 py-2 text-sm font-medium text-black hover:bg-teal-400 disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={onSignUp} className="space-y-3">
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-teal-400/20 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-teal-200/40"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-teal-400/20 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-teal-200/40"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-teal-400/20 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-teal-200/40"
              />
              <input
                type="text"
                placeholder="Invite code (beta)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-md border border-teal-400/20 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-teal-200/40"
              />
              <input
                type="text"
                placeholder="Wallet address (optional)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full rounded-md border border-teal-400/20 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-teal-200/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-teal-500 px-3 py-2 text-sm font-medium text-black hover:bg-teal-400 disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create account"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
