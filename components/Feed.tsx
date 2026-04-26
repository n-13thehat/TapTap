"use client";
import React, { useCallback, useEffect, useState } from "react";
import PostCard, { type Post } from "./PostCard";
import Composer from "./Composer";
import { Loader2, RefreshCw } from "lucide-react";

export default function Feed({ meId }: { meId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const r = await fetch("/api/social/feed");
      if (!r.ok) throw new Error("Failed to load feed");
      const j = await r.json();
      setPosts(j.posts || []);
    } catch {
      setError("Could not load feed. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleLike(postId: string) {
    await fetch("/api/social/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: meId, postId }),
    });
    load();
  }

  return (
    <div className="p-4 space-y-4">
      <Composer authorId={meId} onPosted={load} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Feed</h2>
        <button
          type="button"
          onClick={load}
          aria-label="Refresh feed"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
          <span className="sr-only">Loading feed…</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-300">
          {error}
          <button type="button" onClick={load} className="ml-2 underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
          <p className="text-base font-medium">Nothing here yet.</p>
          <p className="mt-1 text-sm">Be the first to post something!</p>
        </div>
      )}

      {!loading && posts.map(p => (
        <PostCard key={p.id} post={p} onLike={handleLike} />
      ))}
    </div>
  );
}
