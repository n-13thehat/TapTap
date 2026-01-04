"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DraftRecord = {
  text: string;
  savedAt: number;
};

const STORAGE_KEY = "taptap.dmDrafts";

function loadDrafts(): Record<string, DraftRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistDraft(chatId: string, text: string) {
  if (typeof window === "undefined") return;
  const drafts = loadDrafts();
  if (text.trim().length === 0) {
    delete drafts[chatId];
  } else {
    drafts[chatId] = { text, savedAt: Date.now() };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // ignore storage errors
  }
  return drafts[chatId]?.savedAt ?? null;
}

export function useDmDraft(chatId: string) {
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chatId || typeof window === "undefined") return;
    const drafts = loadDrafts();
    const draft = drafts[chatId];
    setText(draft?.text ?? "");
    setLastSaved(draft?.savedAt ?? null);
  }, [chatId]);

  const scheduleSave = useCallback(
    (value: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        const savedAt = persistDraft(chatId, value);
        setLastSaved(savedAt ?? null);
        setIsSaving(false);
      }, 600);
    },
    [chatId]
  );

  const updateText = useCallback(
    (value: string) => {
      setText(value);
      setIsSaving(true);
      scheduleSave(value);
    },
    [scheduleSave]
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setText("");
    setIsSaving(false);
    setLastSaved(null);
    persistDraft(chatId, "");
  }, [chatId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    text,
    updateText,
    clearDraft,
    isSaving,
    lastSaved,
  };
}
