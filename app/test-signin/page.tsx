"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, UserPlus } from "lucide-react";

export default function TestSignInPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();

  const handleSignInClick = () => {
    console.log("Sign in button clicked");
    try {
      router.push("/login");
      console.log("Navigation to /login successful");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleDirectSignIn = async () => {
    console.log("Direct sign in clicked");
    try {
      await signIn("credentials", {
        email: "vx9@taptap.local",
        password: "N13thehat",
        callbackUrl: "/"
      });
      console.log("Direct sign in successful");
    } catch (error) {
      console.error("Direct sign in error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black/80 border border-teal-400/30 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Sign-In Test Page
        </h1>
        
        <div className="space-y-4">
          <div className="text-sm text-teal-100/80 mb-4">
            <p><strong>User:</strong> {user ? user.email || user.name || "Authenticated" : "Not authenticated"}</p>
            <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
          </div>

          <button
            type="button"
            onClick={handleSignInClick}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-teal-400/70 bg-black/80 px-4 py-3 text-sm font-semibold text-teal-100 shadow-[0_0_30px_rgba(45,212,191,0.7)] transition hover:border-teal-300 hover:bg-teal-500/10"
          >
            <LogIn className="h-4 w-4" />
            <span>Test Sign In (Router Push)</span>
          </button>

          <button
            type="button"
            onClick={handleDirectSignIn}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 px-4 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(45,212,191,0.9)] transition hover:brightness-110"
          >
            <UserPlus className="h-4 w-4" />
            <span>Test Direct Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/home")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <span>Back to Home</span>
          </button>
        </div>

        <div className="mt-6 text-xs text-teal-100/60 text-center">
          <p>Check browser console (F12) for debug messages</p>
        </div>
      </div>
    </div>
  );
}
