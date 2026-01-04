"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [notes, setNotes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  async function loadNotes() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const data = await res.json();
    setNotes(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadNotes();
    const id = setInterval(loadNotes, 30_000);
    return () => clearInterval(id);
  }, []);

  const unread = notes.filter((n) => !n.read).length;

  return (
    <div className="relative inline-block text-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
      >
        <Bell className="h-5 w-5 text-white/80" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] rounded-full bg-teal-500 px-1 text-center text-[10px] font-bold text-black">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[85vw] bg-black/80 border border-white/10 rounded-xl p-2 max-h-80 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/60">No notifications</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="p-2 rounded-lg hover:bg-white/5">
                <p className="font-medium text-teal-300 text-sm">{n.title}</p>
                <p className="text-xs text-white/70">{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
