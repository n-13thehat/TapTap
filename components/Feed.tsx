import React, { useEffect, useState } from "react";
import PostCard from "./PostCard";
import Composer from "./Composer";

export default function Feed({ meId }: { meId: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const load = async () => {
    const r = await fetch("/api/social/feed");
    const j = await r.json();
    setPosts(j.posts || []);
  };
  useEffect(()=>{ load() }, []);
  async function handleLike(postId: string) {
    await fetch("/api/social/like", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ userId: meId, postId })});
    load();
  }
  return (
    <div className="p-4 space-y-4">
      <Composer authorId={meId} onPosted={load}/>
      <h2 className="text-xl font-bold">Home</h2>
      {posts.map(p => <PostCard key={p.id} post={p} onLike={handleLike} />)}
    </div>
  );
}
