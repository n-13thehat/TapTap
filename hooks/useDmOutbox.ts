"use client";

import { useCallback, useMemo } from "react";
import { useSyncExternalStore } from "react";

type OutboxState = "pending" | "sending" | "retrying";

type OutboxItem = {
  id: string;
  chatId: string;
  text: string;
  state: OutboxState;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
  createdAt: number;
  clientRequestId: string;
};

const STORAGE_KEY = "taptap.dmOutbox";
const MAX_BACKOFF_MS = 60_000;
const BASE_DELAY_MS = 1_000;

let outboxState: OutboxItem[] = [];
const listeners = new Set<() => void>();
const activeSends = new Set<string>();
let initialized = false;
let schedulerStarted = false;

function readStorage(): OutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeStorage(items: OutboxItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  outboxState = readStorage();
}

function notify() {
  listeners.forEach((listener) => listener());
}

function setOutboxState(updater: (prev: OutboxItem[]) => OutboxItem[]) {
  ensureInitialized();
  outboxState = updater(outboxState);
  writeStorage(outboxState);
  notify();
}

function subscribe(listener: () => void) {
  ensureInitialized();
  listeners.add(listener);
  ensureScheduler();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureInitialized();
  return outboxState;
}

function ensureScheduler() {
  if (schedulerStarted || typeof window === "undefined") return;
  schedulerStarted = true;
  window.setInterval(() => {
    const now = Date.now();
    outboxState
      .filter((item) => item.state !== "sending" && item.nextAttemptAt <= now)
      .forEach((item) => {
        void sendItem(item.id);
      });
  }, 3000);
}

function generateId(prefix = "dm") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function sendItem(itemId: string) {
  ensureInitialized();
  const item = outboxState.find((entry) => entry.id === itemId);
  if (!item || activeSends.has(itemId)) return;

  activeSends.add(itemId);
  setOutboxState((prev) =>
    prev.map((entry) =>
      entry.id === itemId
        ? { ...entry, state: "sending", lastError: undefined }
        : entry
    )
  );

  try {
    const res = await fetch("/api/social/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: item.chatId,
        text: item.text,
        clientRequestId: item.clientRequestId,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    setOutboxState((prev) => prev.filter((entry) => entry.id !== itemId));
  } catch (error: any) {
    const latest = outboxState.find((entry) => entry.id === itemId);
    const attempts = (latest?.attempts ?? item.attempts) + 1;
    const delay = Math.min(MAX_BACKOFF_MS, Math.pow(2, attempts) * BASE_DELAY_MS);
    const message =
      typeof error?.message === "string" ? error.message : "Failed to send";

    setOutboxState((prev) =>
      prev.map((entry) =>
        entry.id === itemId
          ? {
              ...entry,
              state: "retrying",
              attempts,
              lastError: message,
              nextAttemptAt: Date.now() + delay,
            }
          : entry
      )
    );
  } finally {
    activeSends.delete(itemId);
  }
}

function enqueueOutboxItem(chatId: string, text: string) {
  ensureInitialized();
  const entry: OutboxItem = {
    id: generateId("outbox"),
    chatId,
    text,
    state: "pending",
    attempts: 0,
    nextAttemptAt: Date.now(),
    createdAt: Date.now(),
    clientRequestId: generateId("req"),
  };

  setOutboxState((prev) => [...prev, entry]);
  void sendItem(entry.id);
}

function cancelOutboxItem(itemId: string) {
  setOutboxState((prev) => prev.filter((entry) => entry.id !== itemId));
}

function retryItems(itemIds: string[]) {
  setOutboxState((prev) =>
    prev.map((entry) =>
      itemIds.includes(entry.id)
        ? { ...entry, state: "retrying", nextAttemptAt: Date.now() }
        : entry
    )
  );
  itemIds.forEach((id) => {
    void sendItem(id);
  });
}

export function useDmOutbox(chatId?: string) {
  const allItems = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const filteredItems = useMemo(() => {
    if (!chatId) return allItems;
    return allItems.filter((item) => item.chatId === chatId);
  }, [allItems, chatId]);

  const pendingCount = filteredItems.filter(
    (item) => item.state === "pending" || item.state === "sending"
  ).length;
  const failedCount = filteredItems.filter(
    (item) => item.state === "retrying"
  ).length;
  const lastError =
    filteredItems.find((item) => item.lastError)?.lastError ?? undefined;

  const enqueueForChat = useCallback(
    (text: string) => {
      if (!chatId) {
        throw new Error("enqueueForChat requires a chatId");
      }
      const trimmed = text.trim();
      if (!trimmed) return;
      enqueueOutboxItem(chatId, trimmed);
    },
    [chatId]
  );

  const enqueueMessage = useCallback((targetChatId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    enqueueOutboxItem(targetChatId, trimmed);
  }, []);

  const retryFailed = useCallback(() => {
    const ids = filteredItems
      .filter((item) => item.state === "retrying")
      .map((item) => item.id);
    if (ids.length === 0) return;
    retryItems(ids);
  }, [filteredItems]);

  const cancelMessage = useCallback((itemId: string) => {
    cancelOutboxItem(itemId);
  }, []);

  return {
    items: filteredItems,
    enqueueMessage,
    enqueueForChat: chatId ? enqueueForChat : undefined,
    retryFailed,
    cancelMessage,
    pendingCount,
    failedCount,
    lastError,
    isProcessing: activeSends.size > 0,
  };
}
