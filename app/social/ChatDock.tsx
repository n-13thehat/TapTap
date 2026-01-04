"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

type UserLite = { id: string; name: string | null; handle: string; avatarUrl: string | null };
type ConversationLite = {
  id: string;
  createdAt: Date | string;
  participants: UserLite[];
  lastMessage?: { id: string; text: string; createdAt: Date | string; senderId: string } | null;
};

export default function ChatDock({
  meId,
  conversations,
  onSend,
}: {
  meId: string | null;
  conversations: ConversationLite[];
  onSend: (input: { conversationId: string; text: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const active = selected.slice(0, 4);

  const list = useMemo(() => conversations.slice(0, 20), [conversations]);

  return (
    <div className="z-40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 rounded-full bg-teal-500 text-black px-3 py-2 text-sm font-semibold shadow-lg"
      >
        {open ? "Hide Chats" : "Open Chats"}
      </button>
      {open && (
        <div className="fixed bottom-32 right-4 w-80 max-w-[85vw] rounded-xl border border-white/10 bg-black/80 p-2 text-sm text-white">
          <div className="mb-1 text-teal-300 font-semibold">Select up to 4 chats</div>
          <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
            {list.map((c) => {
              const other = c.participants.find((p) => p.id !== meId) ?? c.participants[0];
              const isSel = selected.includes(c.id);
              return (
                <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={(e) =>
                      setSelected((prev) => {
                        const next = e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id);
                        return next.slice(-4);
                      })
                    }
                  />
                  <div className="truncate">{other?.name || other?.handle || "Chat"}</div>
                </label>
              );
            })}
            {list.length === 0 && <div className="p-2 text-white/60">No conversations</div>}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div
          className="fixed bottom-16 right-4 grid gap-2"
          style={{ gridTemplateColumns: active.length > 1 ? "repeat(2, minmax(260px, 320px))" : "minmax(260px, 320px)" }}
        >
          {active.map((id) => (
            <ChatPane key={id} chatId={id} meId={meId} onSend={(text) => onSend({ conversationId: id, text })} onClose={() => setSelected((prev) => prev.filter((x) => x !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatPane({ chatId, meId, onSend, onClose }: { chatId: string; meId: string | null; onSend: (text: string) => Promise<void>; onClose: () => void }) {
  const [items, setItems] = useState<{ id: string; text: string; createdAt: string; senderId: string }[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const r = await fetch(`/social/api/messages?chatId=${encodeURIComponent(chatId)}`, { cache: "no-store" });
        const j = await r.json();
        if (!stop) setItems(j?.items || []);
      } catch {}
    }
    load();
    const id = setInterval(load, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [chatId]);
  async function send() {
    const t = text.trim();
    if (!t) return;
    setText("");
    await onSend(t);
  }
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur p-2 w-[320px] max-w-[80vw]">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs text-white/60">Chat</div>
        <button onClick={onClose} className="text-white/60 hover:text-white text-xs">Close</button>
      </div>
      <div className="max-h-56 overflow-y-auto space-y-1 text-sm">
        {items.map((m) => (
          <div key={m.id} className={`rounded-md px-2 py-1 ${m.senderId === meId ? "bg-teal-600/20 text-teal-200" : "bg-white/10 text-white/80"}`}>{m.text}</div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); start(send); } }} className="flex-1 rounded-md bg-black/40 border border-white/10 px-2 py-1 text-xs" placeholder="Type a message" />
        <button disabled={!text.trim()} onClick={()=>start(send)} className="rounded-md bg-teal-500 text-black text-xs px-2 py-1 disabled:opacity-40">Send</button>
      </div>
    </div>
  );
}

