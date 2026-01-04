"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Users,
  Search,
  MoreVertical,
  Phone,
  Video,
  Settings,
  Plus,
  AlertTriangle
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState
} from "@/components/ui/StandardizedComponents";
import { useMatrixIframes } from "@/hooks/useMatrixIframes";
import { useDmDraft } from "@/hooks/useDmDraft";
import { useDmOutbox } from "@/hooks/useDmOutbox";
import { evaluateDmMessage } from "@/lib/social/dmModeration";

export default function DMPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const globalOutbox = useDmOutbox();

  // Auto-enhance any iframes on this page
  useMatrixIframes();

  useEffect(() => {
    const url = new URL(window.location.href);
    const current = (url.searchParams.get('ids') || '').split(',').map(s=>s.trim()).filter(Boolean);
    setIds(current);
  }, []);

  return (
    <PageContainer showMatrix={true}>
      <PageHeader
        title="Direct Messages"
        subtitle="Private conversations with other creators and fans"
        icon={MessageSquare}
        showBackButton={true}
        actions={
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
            <button className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {ids.length === 0 ? (
          <EmptyState
            title="No conversations selected"
            description="Open a conversation from the Social page or start a new chat with someone."
            action={{
              label: "Go to Social",
              href: "/social"
            }}
            icon={MessageSquare}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              />
            </div>

            <OutboxStatusBar
              pending={globalOutbox.pendingCount}
              failed={globalOutbox.failedCount}
              lastError={globalOutbox.lastError}
              retryFailed={globalOutbox.retryFailed}
            />

            {/* Chat Grid */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: ids.length > 1
                  ? 'repeat(auto-fit, minmax(400px, 1fr))'
                  : 'minmax(400px, 1fr)'
              }}
            >
              <AnimatePresence>
                {ids.slice(0, 4).map((id, index) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ChatPane chatId={id} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </PageContainer>
  );
}

function ChatPane({ chatId }: { chatId: string }) {
  const [items, setItems] = useState<{ id: string; text: string; createdAt: string; senderId: string }[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const { text, updateText, clearDraft, isSaving, lastSaved } = useDmDraft(chatId);
  const outbox = useDmOutbox(chatId);
  const [moderationError, setModerationError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const r = await fetch(`/social/api/messages?chatId=${encodeURIComponent(chatId)}`, { cache: 'no-store' });
        const j = await r.json();
        if (!stop) {
          setItems(j?.items || []);
          setIsOnline(j?.online || false);
        }
      } catch {}
    }
    load();
    const id = setInterval(load, 5000);
    return () => { stop = true; clearInterval(id) };
  }, [chatId]);

  const handleSend = useCallback(() => {
    const value = text.trim();
    if (!value) return;
    const moderation = evaluateDmMessage(value);
    if (!moderation.allowed) {
      setModerationError(moderation.reason || "Message blocked by policy");
      return;
    }
    setModerationError(null);
    if (outbox.enqueueForChat) {
      outbox.enqueueForChat(value);
    } else {
      outbox.enqueueMessage(chatId, value);
    }
    clearDraft();
  }, [chatId, clearDraft, outbox, text]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const pendingMessages = outbox.items;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-teal-300" />
            </div>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-black" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Chat {chatId.slice(0, 8)}</div>
            <div className="text-xs text-white/60">
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
            <Phone className="h-3 w-3" />
          </button>
          <button className="p-1.5 rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
            <Video className="h-3 w-3" />
          </button>
          <button className="p-1.5 rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/40 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            items.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="flex"
              >
                <div className="max-w-[80%] rounded-lg bg-white/10 px-3 py-2">
                  <div className="text-sm text-white">{message.text}</div>
                  <div className="text-xs text-white/40 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {pendingMessages.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-dashed border-white/10">
              {pendingMessages.map((pending) => (
                <div
                  key={pending.id}
                  className="rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/70"
                >
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/50">
                    <span>
                      {pending.state === "sending" ? "Sending…" : pending.state === "retrying" ? "Retrying" : "Queued"}
                    </span>
                    {pending.lastError && (
                      <span className="text-rose-300">{pending.lastError}</span>
                    )}
                  </div>
                  <div className="text-sm text-white mt-1">{pending.text}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
                    <span>Attempts: {pending.attempts}</span>
                    <button
                      onClick={() => outbox.cancelMessage(pending.id)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => updateText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50 resize-none"
              placeholder="Type a message..."
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            disabled={!text.trim()}
            onClick={handleSend}
            className="p-3 bg-teal-500/90 text-black rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {moderationError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4" />
            {moderationError}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-xs text-white/40">
          <span>
            {isSaving
              ? "Saving draft…"
              : lastSaved
              ? formatRelativeTime(lastSaved)
              : "Draft not saved"}
          </span>
          {outbox.failedCount > 0 && (
            <button
              onClick={outbox.retryFailed}
              className="text-rose-300 hover:text-rose-100 transition-colors"
            >
              Retry failed ({outbox.failedCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OutboxStatusBar({
  pending,
  failed,
  lastError,
  retryFailed,
}: {
  pending: number;
  failed: number;
  lastError?: string;
  retryFailed: () => void;
}) {
  if (!pending && !failed && !lastError) return null;
  return (
    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100 flex items-center justify-between">
      <div>
        <div className="font-semibold text-yellow-300">Message outbox</div>
        <div className="text-xs text-yellow-200/80">
          {pending > 0 && <span>{pending} pending · </span>}
          {failed > 0 && <span>{failed} awaiting retry · </span>}
          {lastError && <span>Last error: {lastError}</span>}
        </div>
      </div>
      <button
        onClick={retryFailed}
        className="rounded-md border border-yellow-400/50 px-3 py-1 text-xs uppercase tracking-wide text-yellow-200 hover:bg-yellow-400/10 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function formatRelativeTime(timestamp: number | null) {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  if (diff < 60_000) {
    return `Saved ${Math.max(1, Math.round(diff / 1000))}s ago`;
  }
  if (diff < 3_600_000) {
    return `Saved ${Math.round(diff / 60_000)}m ago`;
  }
  return `Saved ${Math.round(diff / 3_600_000)}h ago`;
}
