"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function DebugSignInPage() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get auth info safely with hooks
  const [authInfo, setAuthInfo] = useState<any>({});
  const [authError, setAuthError] = useState<string | null>(null);

  // Use auth hook properly inside component
  let auth: any = null;
  try {
    auth = useAuth();
  } catch (err: any) {
    // Handle auth hook error
  }

  useEffect(() => {
    if (auth) {
      setAuthInfo({
        user: auth.user,
        loading: auth.loading,
        isAuthenticated: auth.isAuthenticated,
        hasSignIn: typeof auth.signIn === 'function'
      });
      setAuthError(null);
    } else {
      setAuthError('Auth hook failed to initialize');
    }
  }, [auth]);

  useEffect(() => {
    setDebugInfo({
      authInfo,
      authError,
      windowExists: typeof window !== 'undefined',
      routerExists: !!router,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });
  }, []);

  const handleSignInClick = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      console.log("🔍 Debug: Sign in button clicked");
      
      // Test 1: Simple router push
      console.log("🔍 Debug: Testing router.push('/login')");
      router.push("/login");
      setSuccess("Router.push('/login') executed successfully");
      
    } catch (err: any) {
      console.error("❌ Debug: Sign in error:", err);
      setError(`Sign in error: ${err.message}`);
    }
  };

  const handleDirectAuthSignIn = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      console.log("🔍 Debug: Direct auth sign in clicked");
      
      if (!authInfo.hasSignIn || !auth) {
        throw new Error("useAuth().signIn function not available");
      }

      await auth.signIn("credentials", {
        email: "vx9@taptap.local",
        password: "N13thehat",
        callbackUrl: "/"
      });
      
      setSuccess("Direct auth sign in executed successfully");
      
    } catch (err: any) {
      console.error("❌ Debug: Direct auth sign in error:", err);
      setError(`Direct auth sign in error: ${err.message}`);
    }
  };

  const handleNavigateToAuth = () => {
    setError(null);
    setSuccess(null);
    
    try {
      console.log("🔍 Debug: Navigating to /api/auth/signin");
      window.location.href = "/api/auth/signin";
      setSuccess("Navigation to /api/auth/signin initiated");
    } catch (err: any) {
      console.error("❌ Debug: Navigation error:", err);
      setError(`Navigation error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/80 border border-teal-400/30 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            🔍 Sign-In Debug Page
          </h1>
          
          {/* Debug Info */}
          <div className="mb-8 p-4 bg-slate-800/50 rounded-lg">
            <h2 className="text-xl font-semibold text-teal-400 mb-4">Debug Information</h2>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-900/50 border border-green-500/50 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-200">{success}</span>
            </div>
          )}

          {/* Test Buttons */}
          <div className="space-y-4">
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
              onClick={handleDirectAuthSignIn}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 px-4 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(45,212,191,0.9)] transition hover:brightness-110"
            >
              <UserPlus className="h-4 w-4" />
              <span>Test Direct Auth Sign In</span>
            </button>

            <button
              type="button"
              onClick={handleNavigateToAuth}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/70 bg-purple-900/50 px-4 py-3 text-sm font-semibold text-purple-100 transition hover:bg-purple-800/50"
            >
              <span>Navigate to /api/auth/signin</span>
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
            <p>Check browser console (F12) for detailed debug messages</p>
            <p>This page tests the exact same sign-in functionality as the home page</p>
          </div>
        </div>
      </div>
    </div>
  );
}
