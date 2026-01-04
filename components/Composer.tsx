import React, { useState } from "react";

export default function Composer({ authorId, onPosted }: { authorId: string; onPosted?: ()=>void }) {
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  async function submit() {
    if (!authorId) return alert("No authorId");
    const res = await fetch("/api/social/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId, content: text, mediaUrl }),
    });
    if (res.ok) {
      setText(""); setMediaUrl("");
      onPosted?.();
    } else {
      const j = await res.json().catch(()=>null);
      alert("Error posting: " + (j?.error || res.status));
    }
  }

  return (
    <div className="border rounded p-3">
      <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Share something..." className="w-full p-2 rounded bg-black/20"/>
      <input value={mediaUrl} onChange={(e)=>setMediaUrl(e.target.value)} placeholder="media URL (https://...)" className="w-full mt-2 p-2 rounded bg-black/20"/>
      <div className="flex justify-end mt-2">
        <button onClick={submit} className="px-4 py-2 rounded bg-teal-500">Post</button>
      </div>
    </div>
  );
}
