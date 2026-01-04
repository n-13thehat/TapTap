import React from "react";
import { Heart, MessageCircle } from "lucide-react";

type Props = {
  post: any;
  onLike?: (postId: string)=>void;
  onComment?: (postId: string)=>void;
};

export default function PostCard({ post, onLike, onComment }: Props) {
  const likeCount = post.likes?.length || 0;
  return (
    <article className="border rounded p-3 bg-black/40">
      <div className="flex items-center gap-3">
        <img src={post.author?.avatarUrl || "/avatar-placeholder.png"} alt="" className="w-10 h-10 rounded-full"/>
        <div>
          <div className="text-sm font-semibold">{post.author?.name || post.author?.username}</div>
          <div className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</div>
        </div>
      </div>
      {post.content && <div className="mt-2 text-sm">{post.content}</div>}
      {post.mediaUrl && (
        <div className="mt-3">
          {(post.mediaUrl.endsWith(".mp3") || post.mediaUrl.endsWith(".wav")) ? (
            <audio controls src={post.mediaUrl} />
          ) : (
            <img src={post.mediaUrl} alt="media" className="max-h-72 object-cover w-full rounded" />
          )}
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <button onClick={() => onLike?.(post.id)} className="px-2 py-1 rounded hover:bg-white/5 inline-flex items-center gap-1">
          <Heart className="h-4 w-4" /> {likeCount}
        </button>
        <button onClick={() => onComment?.(post.id)} className="px-2 py-1 rounded hover:bg-white/5 inline-flex items-center gap-1">
          <MessageCircle className="h-4 w-4" /> {post.comments?.length || 0}
        </button>
      </div>
    </article>
  );
}