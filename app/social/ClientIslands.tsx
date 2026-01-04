"use client";

import Link from "next/link";
import React, { useEffect, useOptimistic, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Heart, MessageCircle, Coins, Repeat } from "lucide-react";
import { createPost, toggleLike, addComment, followUser, deletePost, restorePost, sendTip } from "./actions";

export type UserLite = { id: string; username: string | null; image: string | null; name: string | null };
export type ProfileLite = { userId: string; bio: string | null; displayName: string | null };

export type PostLite = {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date | string;
  mediaUrl: string | null;
  _count: { comments: number; likes: number; reposts: number };
  author: UserLite & { profile: ProfileLite | null };
  likedByMe?: boolean;
};

export function clsx(...v: (string | false | null | undefined)[]) { return v.filter(Boolean).join(" "); }

export function Avatar({ src, alt, size = 40 }: { src?: string | null; alt: string; size?: number }) {
  const fallback = "/avatar.png";
  return (
    <div className="rounded-full overflow-hidden bg-neutral-800" style={{ width: size, height: size }}>
      <img src={src || fallback} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

export function Composer({ userId, onPosted, userDisplayName, userUsername, userImageUrl }: { userId: string | null; onPosted?: (p: PostLite) => void; userDisplayName?: string; userUsername?: string; userImageUrl?: string }) {
  const [pending, start] = useTransition();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const { toast } = useToast();

  return (
    <form
      action={(fd) => {
        if (!userId) return alert("Sign in to post");
        fd.set("userId", userId);
        fd.set("content", content);
        fd.set("mediaUrl", mediaUrl);
        start(async () => {
          try {
            const res: any = await createPost(fd);
            const nowIso = new Date().toISOString();
            const newPost: PostLite = {
              id: res?.id || Math.random().toString(36).slice(2),
              authorId: userId!,
              content,
              createdAt: nowIso,
              mediaUrl: mediaUrl || null,
              _count: { comments: 0, likes: 0, reposts: 0 },
              author: { id: userId!, username: userUsername ?? null, image: userImageUrl ?? null, name: userDisplayName ?? "You" } as any,
              likedByMe: false,
            };
            onPosted?.(newPost);
            setContent(""); setMediaUrl("");
            toast({ title: `Posted at ${new Date().toLocaleTimeString()}` });
          } catch {
            toast({ title: "Post failed", variant: "destructive" });
          }
        });
      }}
      className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_0_30px_rgba(0,255,200,0.06)]"
    >
      <div className="flex items-start gap-3">
        <Avatar alt={userDisplayName || "you"} src={userImageUrl || undefined} />
        <div className="flex-1">
          <textarea
            placeholder="Drop a thought, clip, or battle."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            name="content"
            rows={3}
            className="w-full resize-none rounded-lg bg-neutral-900 px-3 py-2 outline-none ring-1 ring-teal-500/20 focus:bg-neutral-800 focus:ring-teal-400/40"
          />
          <div className="mt-3 flex items-center justify-between">
            <input
              type="url"
              placeholder="Audio / Video / NFT URL (optional)"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              name="mediaUrl"
              className="w-64 rounded-lg bg-neutral-900 px-3 py-2 outline-none ring-1 ring-teal-500/20 focus:bg-neutral-800 focus:ring-teal-400/40"
            />
            <button
              type="submit"
              disabled={pending || (!content && !mediaUrl)}
              className={clsx("rounded-lg px-4 py-2 font-semibold", pending ? "bg-neutral-700 text-neutral-400" : "bg-teal-500 text-black hover:bg-teal-400")}
            >
              {pending ? "Posting." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function Feed({ initialPosts, userId, initialCursor = null, initialFollowingOnly = false, exposeAddNewPost }: { initialPosts: PostLite[]; userId: string | null; initialCursor?: string | null; initialFollowingOnly?: boolean; exposeAddNewPost?: (fn: (p: PostLite) => void) => void }) {
  const [optimisticPosts, setOptimisticPosts] = useOptimistic(initialPosts, (state, update: any) => {
    if (update?.type === "toggle-like" && update.postId) {
      return state.map((p) => (p.id === update.postId ? { ...p, likedByMe: !p.likedByMe, _count: { ...p._count, likes: p._count.likes + (p.likedByMe ? -1 : 1) } } : p));
    }
    return state;
  });
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [followingOnly, setFollowingOnly] = useState<boolean>(initialFollowingOnly);
  const [loading, setLoading] = useState(false);
  const [buffered, setBuffered] = useState<PostLite[]>([]);
  const [persistedBufferCount, setPersistedBufferCount] = useState<number>(0);
  const [atTop, setAtTop] = useState(true);
  const { toast } = useToast();

  const fetchMore = React.useCallback(async (reset: boolean, overrideCursor?: string | null) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("followingOnly", String(followingOnly));
      const cur = overrideCursor !== undefined ? overrideCursor : cursor;
      if (!reset && cur) params.set("cursor", cur);
      const res = await fetch(`/api/social/feed?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const items = (data?.items || []) as PostLite[];
      const next = (data?.nextCursor as string) || null;
      if (reset) setOptimisticPosts(items as any);
      else if (items.length) setOptimisticPosts([...(optimisticPosts as any), ...items] as any);
      setCursor(next);
      try {
        const url = new URL(window.location.href);
        if (next) url.searchParams.set("cursor", next); else url.searchParams.delete("cursor");
        window.history.replaceState({}, "", url.toString());
      } catch {}
      toast({ title: (items.length ? `Loaded ${items.length} older` : `End of feed`) + ` at ${new Date().toLocaleTimeString()}` });
    } finally {
      setLoading(false);
    }
  }, [loading, followingOnly, cursor, optimisticPosts, setOptimisticPosts, toast]);

  function onToggleFollowingOnly() {
    setFollowingOnly((v) => !v);
    setCursor(null);
    fetchMore(true, null);
    try {
      const next = !followingOnly;
      localStorage.setItem("social_following_only", next ? "1" : "0");
      const url = new URL(window.location.href);
      url.searchParams.set("following", next ? "1" : "0");
      window.history.replaceState({}, "", url.toString());
    } catch {}
  }

  async function fetchNewer() {
    if ((optimisticPosts as any).length === 0) return;
    const first = (optimisticPosts as any)[0] as PostLite;
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("followingOnly", String(followingOnly));
    params.set("after", String(first.createdAt));
    const res = await fetch(`/api/social/feed?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    const items = (data?.items || []) as PostLite[];
    if (items.length) {
      setOptimisticPosts([...(items as any), ...(optimisticPosts as any)] as any);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast({ title: (items.length ? `Loaded ${items.length} new` : `No newer posts`) + ` at ${new Date().toLocaleTimeString()}` });
  }

  useEffect(() => {
    if (!exposeAddNewPost) return;
    const add = (np: PostLite) => {
      if (atTop) {
        setOptimisticPosts([np, ...(optimisticPosts as any)] as any);
      } else {
        setBuffered([np, ...buffered]);
      }
    };
    exposeAddNewPost(add);
  }, [exposeAddNewPost, optimisticPosts, atTop, buffered, setOptimisticPosts]);

  // Realtime bridge: listen for inserts broadcast by app/social/RealtimePosts
  useEffect(() => {
    const onNew = (e: any) => {
      const d = e?.detail;
      if (!d) return;
      const np: PostLite = {
        id: d.id || Math.random().toString(36).slice(2),
        authorId: d.authorId,
        content: d.content || "",
        createdAt: d.createdAt || new Date().toISOString(),
        mediaUrl: d.mediaUrl || null,
        _count: { comments: 0, likes: 0, reposts: 0 },
        author: { id: d.authorId, username: d.authorUsername || null, image: null, name: null } as any,
        likedByMe: false,
      };
      if (atTop) setOptimisticPosts([np, ...(optimisticPosts as any)] as any);
      else setBuffered([np, ...buffered]);
    };
    window.addEventListener("social:new-post", onNew as any);
    return () => window.removeEventListener("social:new-post", onNew as any);
  }, [atTop, optimisticPosts, buffered, setOptimisticPosts]);

  useEffect(() => {
    function onScroll() {
      setAtTop(window.scrollY < 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const qs = url.searchParams.get("following");
      if (qs === "1" || qs === "0") {
        const val = qs === "1";
        setFollowingOnly(val);
        localStorage.setItem("social_following_only", val ? "1" : "0");
      } else {
        const stored = localStorage.getItem("social_following_only");
        if (stored === "1" || stored === "0") {
          setFollowingOnly(stored === "1");
        }
      }
      const cur = url.searchParams.get("cursor");
      if (cur) {
        setCursor(cur);
        fetchMore(true, cur);
      }
      const buf = parseInt(sessionStorage.getItem("social_buffer_count") || "0", 10);
      if (!isNaN(buf) && buf > 0) setPersistedBufferCount(buf);
    } catch {}
  }, [fetchMore]);

  useEffect(() => {
    try {
      sessionStorage.setItem("social_buffer_count", String(buffered.length));
      setPersistedBufferCount(buffered.length);
    } catch {}
  }, [buffered]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1">
          <button onClick={() => { if (followingOnly) onToggleFollowingOnly(); }} className={clsx("px-3 py-1 rounded-full", !followingOnly ? "bg-teal-500 text-black" : "hover:bg-white/10 text-neutral-300")}>For You</button>
          <button onClick={() => { if (!followingOnly) onToggleFollowingOnly(); }} className={clsx("px-3 py-1 rounded-full", followingOnly ? "bg-teal-500 text-black" : "hover:bg-white/10 text-neutral-300")}>Following</button>
        </div>
        <div className="inline-flex items-center gap-3">
          <button onClick={fetchNewer} className="rounded border border-white/10 px-2 py-1 hover:bg-white/10 disabled:opacity-50">Load newer</button>
          <span className="text-xs text-white/50">{(optimisticPosts as any)?.length ?? 0} loaded{cursor ? " - more available" : ""}</span>
          <button onClick={() => fetchMore(false)} disabled={loading || !cursor} className="rounded border border-white/10 px-2 py-1 hover:bg-white/10 disabled:opacity-50">
            {loading ? "Loading..." : (cursor ? "Load more" : "End of feed")}
          </button>
        </div>
      </div>
      {followingOnly && (
        <div className="text-[11px] text-white/40">Following — posts from creators you follow</div>
      )}
      {(buffered.length > 0 || persistedBufferCount > 0) && (
        <div className="sticky top-16 z-10">
          <button onClick={() => { if (buffered.length > 0) { setOptimisticPosts([...(buffered as any), ...(optimisticPosts as any)] as any); setBuffered([]); } else { fetchNewer(); } try { sessionStorage.removeItem("social_buffer_count"); setPersistedBufferCount(0); } catch {} window.scrollTo({ top: 0, behavior: "smooth" }); }} className="mx-auto block rounded bg-teal-600 px-3 py-1 text-sm font-medium text-black shadow">
            Load {buffered.length > 0 ? buffered.length : persistedBufferCount} new
          </button>
        </div>
      )}
      {optimisticPosts.map((p) => (
        <RichPostCard key={p.id} post={p} userId={userId} onToggleLike={(id) => setOptimisticPosts({ type: "toggle-like", postId: id })} />
      ))}
    </div>
  );
}

export function PostCard({ post, userId, onToggleLike }: { post: PostLite; userId: string | null; onToggleLike: (id: string) => void }) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [pendingLike, startLike] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const { toast } = useToast();

  const authorName = (post.author as any)?.profile?.displayName || (post.author as any)?.name || (post.author as any)?.username || "unknown";

  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-start gap-3">
        <Avatar alt={authorName} src={(post.author as any)?.image || undefined} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Link href={`/u/${(post.author as any)?.username || post.authorId}`} className="font-semibold text-neutral-100 hover:underline">{authorName}</Link>
            <span>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒ...Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢</span>
            <time title={String(post.createdAt)}>{timeAgo(post.createdAt)}</time>
          </div>
          <div className="mt-2 whitespace-pre-wrap break-words text-neutral-100">{post.content}</div>
          {post.mediaUrl ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-neutral-800 bg-black">
              <img src={post.mediaUrl} alt="media" className="w-full object-cover" />
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-6 text-sm text-neutral-400">
            <button
              onClick={() => {
                if (!userId) return alert("Sign in to like");
                startLike(async () => {
                  onToggleLike(post.id);
                  const fd = new FormData();
                  fd.set("userId", userId);
                  fd.set("postId", post.id);
                  try { await toggleLike(fd); } catch { toast({ title: "Like failed", variant: "destructive" }); }
                });
              }}
              disabled={pendingLike}
              className={clsx("inline-flex items-center gap-2", post.likedByMe ? "text-teal-400" : "hover:text-neutral-200", pendingLike && "opacity-60")}
            >
              <Heart className="h-4 w-4" /> {post._count.likes}
            </button>

            <button onClick={() => setCommentOpen((s) => !s)} className="hover:text-neutral-200 inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> {post._count.comments}
            </button>
            <button className="hover:text-neutral-200 inline-flex items-center gap-2">
              <Repeat className="h-4 w-4" /> {post._count.reposts}
            </button>

            {userId === post.authorId && (
              <form
                action={(fd) => {
                  if (!userId) return;
                  fd.set("userId", userId);
                  fd.set("postId", post.id);
                  startDelete(async () => {
                    try {
                      await deletePost(fd);
                      toast({
                        title: "Post deleted",
                        action: (
                          <ToastAction
                            altText="Undo"
                            onClick={async () => {
                              try {
                                const fd2 = new FormData();
                                fd2.set("userId", userId!);
                                fd2.set("postId", post.id);
                                await restorePost(fd2 as any);
                                toast({ title: "Post restored" });
                              } catch {
                                toast({ title: "Restore failed", variant: "destructive" });
                              }
                            }}
                          >
                            Undo
                          </ToastAction>
                        ) as any,
                      });
                    } catch {
                      toast({ title: "Delete failed", variant: "destructive" });
                    }
                  });
                }}
              >
                <button type="submit" className="hover:text-red-400" disabled={pendingDelete}>{pendingDelete ? "Deleting." : "Delete"}</button>
              </form>
            )}
          </div>

          {commentOpen ? <CommentBox postId={post.id} userId={userId} /> : null}
        </div>
      </div>
    </article>
  );
}

export function RichPostCard({ post, userId, onToggleLike }: { post: PostLite; userId: string | null; onToggleLike: (id: string) => void }) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [pendingLike, startLike] = useTransition();
  const [pendingTip, startTip] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const { toast } = useToast();

  const authorName = (post.author as any)?.profile?.displayName || (post.author as any)?.name || (post.author as any)?.username || "unknown";
  const [tipsCount, setTipsCount] = useState<number>((post as any)?._count?.reposts ?? 0);

  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-start gap-3">
        <Avatar alt={authorName} src={(post.author as any)?.image || undefined} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Link href={`/u/${(post.author as any)?.username || post.authorId}`} className="font-semibold text-neutral-100 hover:underline">{authorName}</Link>
            <span>·</span>
            <time title={String(post.createdAt)}>{timeAgo(post.createdAt)}</time>
          </div>
          <div className="mt-2 whitespace-pre-wrap break-words text-neutral-100">{post.content}</div>
          {post.mediaUrl ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-neutral-800 bg-black">
              {/[.](mp3|wav|ogg)$/i.test(post.mediaUrl) ? (
                <audio controls className="w-full">
                  <source src={post.mediaUrl} />
                  Your browser does not support the audio element.
                </audio>
              ) : /[.](mp4|webm|mov)$/i.test(post.mediaUrl) ? (
                <video controls className="w-full">
                  <source src={post.mediaUrl} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img src={post.mediaUrl} alt="media" className="w-full object-cover" />
              )}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-6 text-sm text-neutral-400">
            <button
              onClick={() => {
                if (!userId) return alert("Sign in to like");
                startLike(async () => {
                  onToggleLike(post.id);
                  const fd = new FormData();
                  fd.set("userId", userId!);
                  fd.set("postId", post.id);
                  try { await toggleLike(fd); } catch { toast({ title: "Like failed", variant: "destructive" }); }
                });
              }}
              disabled={pendingLike}
              className={clsx("inline-flex items-center gap-2", post.likedByMe ? "text-teal-400" : "hover:text-neutral-200", pendingLike && "opacity-60")}
            >
              <Heart className="h-4 w-4" /> {post._count.likes}
            </button>

            <button onClick={() => setCommentOpen((s) => !s)} className="hover:text-neutral-200 inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> {post._count.comments}
            </button>
            <button
              onClick={() => {
                if (!userId) return alert("Sign in to tip");
                startTip(async () => {
                  const fd = new FormData();
                  fd.set("userId", userId!);
                  fd.set("postId", post.id);
                  fd.set("amount", "1");
                  try { await sendTip(fd); setTipsCount((c) => c + 1); toast({ title: "Tipped 1 TAP" }); }
                  catch { toast({ title: "Tip failed", variant: "destructive" }); }
                });
              }}
              disabled={pendingTip}
              className={clsx("hover:text-neutral-200 inline-flex items-center gap-2", pendingTip && "opacity-60")}
            >
              <Coins className="h-4 w-4 text-teal-400" /> {tipsCount}
            </button>

            {userId === post.authorId && (
              <form
                action={(fd) => {
                  if (!userId) return;
                  fd.set("userId", userId);
                  fd.set("postId", post.id);
                  startDelete(async () => {
                    try { await deletePost(fd); toast({ title: "Post deleted" }); }
                    catch { toast({ title: "Delete failed", variant: "destructive" }); }
                  });
                }}
              >
                <button type="submit" className="hover:text-red-400" disabled={pendingDelete}>{pendingDelete ? "Deleting." : "Delete"}</button>
              </form>
            )}
          </div>

          {commentOpen ? <CommentBox postId={post.id} userId={userId} /> : null}
        </div>
      </div>
    </article>
  );
}

function CommentBox({ postId, userId }: { postId: string; userId: string | null }) {
  const [pending, start] = useTransition();
  const [content, setContent] = useState("");
  const { toast } = useToast();
  return (
    <form
      action={(fd) => {
        if (!userId) return alert("Sign in to comment");
        if (!content.trim()) return;
        fd.set("userId", userId);
        fd.set("postId", postId);
        fd.set("content", content.trim());
        start(async () => {
          try { await addComment(fd); setContent(""); toast({ title: `Comment posted at ${new Date().toLocaleTimeString()}` }); }
          catch { toast({ title: "Comment failed", variant: "destructive" }); }
        });
      }}
      className="mt-3 flex items-center gap-2"
    >
      <input name="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a comment." className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 outline-none focus:bg-neutral-800" />
      <button type="submit" disabled={pending || !content.trim()} className={clsx("rounded-lg px-3 py-2 font-semibold", pending ? "bg-neutral-700 text-neutral-400" : "bg-neutral-800 hover:bg-neutral-700")}>Reply</button>
    </form>
  );
}

export function WhoToFollow({ suggestions, currentUserId }: { suggestions: (UserLite & { profile?: ProfileLite | null })[]; currentUserId: string | null }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-3 text-sm font-semibold text-neutral-300">Who to follow</div>
      <div className="space-y-2">
        {suggestions.map((u) => <FollowRow key={u.id} u={u} currentUserId={currentUserId} />)}
      </div>
    </div>
  );
}

function FollowRow({ u, currentUserId }: { u: UserLite & { profile?: ProfileLite | null }; currentUserId: string | null }) {
  const [pending, start] = useTransition();
  const [following, setFollowing] = useState(false);
  const { toast } = useToast();
  const displayName = u?.profile?.displayName || u?.name || u?.username || "unknown";
  const handle = u?.username ? ` (@${u.username})` : "";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-900 px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar alt={displayName} src={u.image || undefined} />
        <div className="truncate">
          <div className="truncate font-semibold text-neutral-100">{displayName}</div>
          {u?.profile?.bio ? <div className="truncate text-xs text-neutral-400">{u.profile.bio}</div> : null}
        </div>
      </div>
      <form
        action={(fd) => {
          if (!currentUserId) return alert("Sign in to follow");
          fd.set("followerId", currentUserId);
          fd.set("followingId", u.id);
          start(async () => {
            try {
              await followUser(fd);
              const next = !following;
              setFollowing(next);
              if (next) {
                toast({ title: `Following ${displayName}${handle}` });
              } else {
                const undo = async () => {
                  try {
                    const fd2 = new FormData();
                    fd2.set("followerId", currentUserId!);
                    fd2.set("followingId", u.id);
                    await followUser(fd2);
                    setFollowing(true);
                    toast({ title: `Following ${displayName}${handle}` });
                  } catch {
                    toast({ title: "Undo failed", variant: "destructive" });
                  }
                };
                toast({ title: `Unfollowed ${displayName}${handle}`, action: (
                  <ToastAction altText="Undo" onClick={undo}>Undo</ToastAction>
                ) as any });
              }
            } catch {
              toast({ title: "Follow failed", variant: "destructive" });
            }
          });
        }}
      >
        <button type="submit" disabled={pending} className={clsx("rounded-lg px-3 py-1 text-sm font-semibold",
          following ? "bg-white/10 text-white" : "bg-teal-500 text-black hover:bg-teal-400",
          pending && "opacity-60")}>{following ? (u.username ? `Following @${u.username}` : "Following") : (u.username ? `Follow @${u.username}` : "Follow")}</button>
      </form>
    </div>
  );
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
