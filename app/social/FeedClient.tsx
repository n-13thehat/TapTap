"use client";

import { useOptimistic, useTransition } from "react";
import { Heart, MessageCircle, Repeat2, Send } from "lucide-react";
import { createPostAction, toggleLikeAction, createTradeAction } from "./actions";

type Post = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name?: string | null; avatarUrl?: string | null };
  likes: { userId: string }[];
};

export default function FeedClient({
  me,
  initialPosts,
}: {
  me: { id: string | null };
  initialPosts: Post[];
}) {
  const [isPending, start] = useTransition();
  const [posts, setPosts] = useOptimistic(initialPosts);

  // Optimistic like
  function likeForm(postId: string) {
    return {
      action: (formData: FormData) => {
        start(async () => {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    likes: toggleLikeLocal(p.likes, me.id),
                  }
                : p
            )
          );
          await toggleLikeAction(formData);
        });
      },
    };
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* composer */}
      <form
        action={createPostAction}
        className="rounded-xl border border-teal-500/30 bg-black/40 backdrop-blur p-4"
      >
        <textarea
          name="text"
          placeholder="Share something for your fans…"
          className="w-full bg-transparent outline-none resize-none h-20 text-teal-100 placeholder-teal-500/50"
          maxLength={500}
        />
        <div className="flex items-center justify-between pt-3">
          <span className="text-xs text-teal-500/70">
            {isPending ? "Posting…" : "tap in, be civil"}
          </span>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-teal-500/90 hover:bg-teal-400 text-black font-medium"
          >
            <Send size={16} /> Post
          </button>
        </div>
      </form>

      {/* feed */}
      <ul className="space-y-4">
        {posts.map((p) => {
          const likedByMe = !!p.likes.find((l) => l.userId === me.id);
          return (
            <li key={p.id} className="rounded-xl border border-teal-500/20 bg-black/40 p-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-500/20 overflow-hidden">
                  {p.user?.avatarUrl ? (
                    <img src={p.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-teal-200">
                    <span className="font-semibold">{p.user?.name ?? "anon"}</span>
                    <span className="text-xs text-teal-500/60">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-teal-100/90 whitespace-pre-wrap">{p.text}</p>

                  <div className="mt-3 flex items-center gap-4 text-teal-300/80">
                    {/* like button via formAction */}
                    <form {...likeForm(p.id)}>
                      <input type="hidden" name="postId" value={p.id} />
                      <button
                        type="submit"
                        className={"inline-flex items-center gap-1.5 " + (likedByMe ? "text-teal-400" : "hover:text-teal-200")}
                        aria-pressed={likedByMe}
                        title="Like"
                      >
                        <Heart size={18} /> {p.likes.length}
                      </button>
                    </form>

                    <button className="inline-flex items-center gap-1.5 hover:text-teal-200" title="Reply (coming soon)">
                      <MessageCircle size={18} /> Reply
                    </button>

                    <button className="inline-flex items-center gap-1.5 hover:text-teal-200" title="Repost (coming soon)">
                      <Repeat2 size={18} /> Repost
                    </button>

                    {/* quick trade demo */}
                    {me.id && me.id !== p.user?.id ? (
                      <form action={createTradeAction} className="ml-auto">
                        <input type="hidden" name="receiverId" value={p.user?.id ?? ""} />
                        <input type="hidden" name="offeredTrackId" value={"demo-track-id"} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-teal-500/40 hover:bg-teal-500/10"
                          title="Offer a trade"
                        >
                          🤝 Trade
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function toggleLikeLocal(likes: { userId: string }[], meId: string | null) {
  if (!meId) return likes;
  const i = likes.findIndex((l) => l.userId === meId);
  if (i >= 0) {
    const cp = likes.slice();
    cp.splice(i, 1);
    return cp;
  }
  return likes.concat({ userId: meId });
}
