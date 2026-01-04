"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { SocialManager } from '@/lib/social/socialManager';
import { ModerationSystem, type UserReport } from '@/lib/social/moderationSystem';
import { 
  SocialPost, 
  SocialDraft, 
  OutboxItem, 
  SocialThread,
  SocialSettings
} from '@/lib/social/types';
import { useAuth } from './useAuth';

/**
 * Hook for social functionality
 */
export function useSocial() {
  const { user } = useAuth();
  const socialManager = useRef<SocialManager | null>(null);
  const moderationSystem = useRef<ModerationSystem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [drafts, setDrafts] = useState<SocialDraft[]>([]);

  const loadData = useCallback(() => {
    if (socialManager.current) {
      const userDrafts = socialManager.current.getUserDrafts();
      setDrafts(userDrafts);
    }
  }, []);

  // Initialize social manager
  useEffect(() => {
    if (user?.id && !socialManager.current) {
      socialManager.current = new SocialManager(user.id);
      moderationSystem.current = new ModerationSystem();
      setIsInitialized(true);
    }
    loadData();
  }, [loadData, user?.id]);

  const saveDraft = useCallback(async (draftData: Partial<SocialDraft>) => {
    if (!socialManager.current) return null;

    try {
      const draft = await socialManager.current.saveDraft(draftData);
      loadData();
      return draft;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }, [loadData]);

  const publishPost = useCallback(async (postData: Partial<SocialPost>, draftId?: string) => {
    if (!socialManager.current) return null;

    try {
      const postId = await socialManager.current.publishPost(postData, draftId);
      loadData();
      return postId;
    } catch (error) {
      console.error('Failed to publish post:', error);
      throw error;
    }
  }, [loadData]);

  const createReply = useCallback(async (parentId: string, content: string, attachments: any[] = []) => {
    if (!socialManager.current) return null;

    try {
      const replyId = await socialManager.current.createReply(parentId, content, attachments);
      loadData();
      return replyId;
    } catch (error) {
      console.error('Failed to create reply:', error);
      throw error;
    }
  }, [loadData]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!socialManager.current) return;

    try {
      await socialManager.current.toggleLike(postId);
      loadData();
    } catch (error) {
      console.error('Failed to toggle like:', error);
      throw error;
    }
  }, [loadData]);

  const getThread = useCallback((threadId: string) => {
    if (!socialManager.current) return null;
    return socialManager.current.getThread(threadId);
  }, []);

  const getOutboxStatus = useCallback(() => {
    if (!socialManager.current) return { pending: 0, sending: 0, failed: 0, total: 0 };
    return socialManager.current.getOutboxStatus();
  }, []);

  const retryFailedItems = useCallback(async () => {
    if (!socialManager.current) return;

    try {
      await socialManager.current.retryFailedItems();
      loadData();
    } catch (error) {
      console.error('Failed to retry failed items:', error);
      throw error;
    }
  }, [loadData]);

  const clearOutbox = useCallback(async () => {
    if (!socialManager.current) return;

    try {
      await socialManager.current.clearOutbox();
      loadData();
    } catch (error) {
      console.error('Failed to clear outbox:', error);
      throw error;
    }
  }, [loadData]);

  const reportContent = useCallback(async (
    targetType: 'post' | 'user' | 'comment',
    targetId: string,
    reason: string,
    description: string
  ) => {
    if (!moderationSystem.current || !user?.id) return null;

    try {
      const report = await moderationSystem.current.handleUserReport(
        user.id,
        targetType,
        targetId,
        reason as any,
        description
      );
      return report;
    } catch (error) {
      console.error('Failed to report content:', error);
      throw error;
    }
  }, [user?.id]);

  return {
    isInitialized,
    posts,
    drafts,
    saveDraft,
    publishPost,
    createReply,
    toggleLike,
    getThread,
    getOutboxStatus,
    retryFailedItems,
    clearOutbox,
    reportContent,
    refreshData: loadData,
  };
}

/**
 * Hook for draft management with auto-save
 */
export function useDraftEditor(initialDraft?: Partial<SocialDraft>) {
  const { saveDraft } = useSocial();
  const [draft, setDraft] = useState<Partial<SocialDraft>>(initialDraft || {});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const updateDraft = useCallback((updates: Partial<SocialDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
    
    // Schedule auto-save
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(async () => {
      if (updates.content && updates.content.trim().length > 0) {
        setIsSaving(true);
        try {
          await saveDraft({ ...draft, ...updates });
          setLastSaved(Date.now());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [draft, saveDraft]);

  const manualSave = useCallback(async () => {
    if (!draft.content || draft.content.trim().length === 0) return;

    setIsSaving(true);
    try {
      const savedDraft = await saveDraft(draft);
      setLastSaved(Date.now());
      return savedDraft;
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [draft, saveDraft]);

  const resetDraft = useCallback(() => {
    setDraft(initialDraft || {});
    setLastSaved(null);
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
  }, [initialDraft]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  return {
    draft,
    updateDraft,
    manualSave,
    resetDraft,
    isSaving,
    lastSaved,
    hasUnsavedChanges: lastSaved === null || (draft.last_saved_at ?? 0) > lastSaved,
  };
}

/**
 * Hook for outbox management
 */
export function useOutbox() {
  const { getOutboxStatus, retryFailedItems, clearOutbox } = useSocial();
  const [status, setStatus] = useState({ pending: 0, sending: 0, failed: 0, total: 0 });
  const [isRetrying, setIsRetrying] = useState(false);

  const refreshStatus = useCallback(() => {
    const currentStatus = getOutboxStatus();
    setStatus(currentStatus);
  }, [getOutboxStatus]);

  const retry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await retryFailedItems();
      refreshStatus();
    } catch (error) {
      console.error('Failed to retry outbox items:', error);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [retryFailedItems, refreshStatus]);

  const clear = useCallback(async () => {
    try {
      await clearOutbox();
      refreshStatus();
    } catch (error) {
      console.error('Failed to clear outbox:', error);
      throw error;
    }
  }, [clearOutbox, refreshStatus]);

  // Auto-refresh status
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    status,
    isRetrying,
    retry,
    clear,
    refreshStatus,
    hasFailedItems: status.failed > 0,
    hasPendingItems: status.pending > 0 || status.sending > 0,
  };
}

/**
 * Hook for thread management
 */
export function useThread(threadId: string) {
  const { getThread, createReply } = useSocial();
  const [thread, setThread] = useState<SocialThread | null>(null);
  const [loading, setLoading] = useState(false);

  const loadThread = useCallback(() => {
    if (!threadId) return;
    
    setLoading(true);
    try {
      const threadData = getThread(threadId);
      setThread(threadData);
    } catch (error) {
      console.error('Failed to load thread:', error);
    } finally {
      setLoading(false);
    }
  }, [threadId, getThread]);

  const reply = useCallback(async (content: string, attachments: any[] = []) => {
    if (!thread) return null;

    try {
      const replyId = await createReply(thread.root_post_id, content, attachments);
      loadThread(); // Refresh thread
      return replyId;
    } catch (error) {
      console.error('Failed to create reply:', error);
      throw error;
    }
  }, [thread, createReply, loadThread]);

  // Load thread when threadId changes
  useEffect(() => {
    loadThread();
  }, [loadThread]);

  return {
    thread,
    loading,
    reply,
    refreshThread: loadThread,
  };
}

/**
 * Hook for moderation
 */
export function useModeration() {
  const { reportContent } = useSocial();
  const [isReporting, setIsReporting] = useState(false);

  const report = useCallback(async (
    targetType: 'post' | 'user' | 'comment',
    targetId: string,
    reason: string,
    description: string
  ) => {
    setIsReporting(true);
    try {
      const report = await reportContent(targetType, targetId, reason, description);
      return report;
    } catch (error) {
      console.error('Failed to report content:', error);
      throw error;
    } finally {
      setIsReporting(false);
    }
  }, [reportContent]);

  return {
    report,
    isReporting,
  };
}
