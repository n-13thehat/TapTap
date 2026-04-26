"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt?: string;
}

export function NotificationBell() {
  const [notes, setNotes] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const loadNotes = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
    const id = setInterval(loadNotes, 30_000);
    return () => clearInterval(id);
  }, [loadNotes]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unread = notes.filter((n) => !n.read).length;

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? ` — ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-teal-500 px-1 text-center text-[10px] font-bold text-black"
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8" role="status">
                <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                <span className="sr-only">Loading notifications…</span>
              </div>
            )}

            {error && !loading && (
              <p className="px-4 py-6 text-center text-sm text-red-400">
                Failed to load.{" "}
                <button type="button" onClick={loadNotes} className="underline hover:no-underline">
                  Retry
                </button>
              </p>
            )}

            {!loading && !error && notes.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-white/50">
                You're all caught up ✓
              </p>
            )}

            {!loading && !error && notes.map((n) => (
              <div
                key={n.id}
                className={`border-b border-white/5 px-4 py-3 last:border-0 ${n.read ? "opacity-60" : ""}`}
              >
                <p className="text-sm font-medium text-teal-300">{n.title}</p>
                {n.message && (
                  <p className="mt-0.5 text-xs text-white/60">{n.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
