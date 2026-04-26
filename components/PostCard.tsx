import React from "react";
import { Heart, MessageCircle } from "lucide-react";

export interface Post {
  id: string;
  content?: string;
  mediaUrl?: string;
  createdAt: string;
  likes?: { id: string }[];
  comments?: { id: string }[];
  author?: {
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
}

type Props = {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
};

export default function PostCard({ post, onLike, onComment }: Props) {
  const likeCount = post.likes?.length ?? 0;
  const commentCount = post.comments?.length ?? 0;
  const authorName = post.author?.name || post.author?.username || "Anonymous";
  const isAudio = post.mediaUrl?.endsWith(".mp3") || post.mediaUrl?.endsWith(".wav");

  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20 hover:bg-black/60">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <img
          src={post.author?.avatarUrl || "/avatar-placeholder.png"}
          alt={`${authorName}'s avatar`}
          className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
        />
        <div>
          <div className="text-sm font-semibold text-white">{authorName}</div>
          <div className="text-xs text-white/40">
            {new Date(post.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="mt-3 text-sm leading-relaxed text-white/85">{post.content}</p>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <div className="mt-3 overflow-hidden rounded-lg">
          {isAudio ? (
            <audio controls src={post.mediaUrl} className="w-full" />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="max-h-72 w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3 text-sm text-white/50">
        <button
          type="button"
          onClick={() => onLike?.(post.id)}
          aria-label={`Like post — ${likeCount} likes`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-red-400"
        >
          <Heart className="h-4 w-4" />
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => onComment?.(post.id)}
          aria-label={`Comment — ${commentCount} comments`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-teal-400"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </button>
      </div>
    </article>
  );
}