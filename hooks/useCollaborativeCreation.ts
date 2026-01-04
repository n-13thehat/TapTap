"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { CollaborativeCreationManager } from '@/lib/collaborative-creation/collaborativeCreationManager';
import { 
  CollaborativeProject, 
  CollaborativeTrack,
  CollaborationSession,
  TrackComment,
  TrackSuggestion,
  Operation,
  CollaborationAnalytics,
  LiveCursor
} from '@/lib/collaborative-creation/types';
import { useAuth } from './useAuth';

/**
 * Hook for collaborative creation functionality
 */
export function useCollaborativeCreation() {
  const { user } = useAuth();
  const collaborationManager = useRef<CollaborativeCreationManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [projects, setProjects] = useState<CollaborativeProject[]>([]);
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);

  const loadUserProjects = useCallback(() => {
    if (!collaborationManager.current || !user?.id) return;

    const userProjects = collaborationManager.current.getUserProjects(user.id);
    setProjects(userProjects);
  }, [user?.id]);

  // Initialize Collaborative Creation Manager
  useEffect(() => {
    if (!collaborationManager.current) {
      collaborationManager.current = new CollaborativeCreationManager(user?.id);
      setIsInitialized(true);
    }
    loadUserProjects();
  }, [loadUserProjects, user?.id]);

  const createProject = useCallback(async (projectData: {
    name: string;
    description: string;
    visibility: 'private' | 'collaborators' | 'public';
    collaboration_mode: 'open' | 'invite_only' | 'approval_required';
  }) => {
    if (!collaborationManager.current) return null;

    try {
      const projectId = await collaborationManager.current.createProject(projectData);
      loadUserProjects();
      return projectId;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [loadUserProjects]);

  const joinProject = useCallback(async (projectId: string, inviteCode?: string) => {
    if (!collaborationManager.current) return null;

    try {
      const session = await collaborationManager.current.joinProject(projectId, inviteCode);
      setActiveSession(session);
      loadUserProjects();
      return session;
    } catch (error) {
      console.error('Failed to join project:', error);
      throw error;
    }
  }, [loadUserProjects]);

  const createTrack = useCallback(async (projectId: string, trackData: {
    name: string;
    description?: string;
    type: 'audio' | 'midi' | 'hybrid';
  }) => {
    if (!collaborationManager.current) return null;

    try {
      const trackId = await collaborationManager.current.createTrack(projectId, trackData);
      loadUserProjects();
      return trackId;
    } catch (error) {
      console.error('Failed to create track:', error);
      throw error;
    }
  }, [loadUserProjects]);

  const applyOperation = useCallback(async (projectId: string, trackId: string, operation: Omit<Operation, 'id' | 'timestamp' | 'user_id'>) => {
    if (!collaborationManager.current) return false;

    try {
      const success = await collaborationManager.current.applyOperation(projectId, trackId, operation);
      if (success) {
        loadUserProjects();
      }
      return success;
    } catch (error) {
      console.error('Failed to apply operation:', error);
      return false;
    }
  }, [loadUserProjects]);

  const addComment = useCallback(async (projectId: string, trackId: string, commentData: {
    content: string;
    audio_timestamp?: number;
    midi_position?: number;
    lyrics_line_id?: string;
    parent_comment_id?: string;
  }) => {
    if (!collaborationManager.current) return null;

    try {
      const commentId = await collaborationManager.current.addComment(projectId, trackId, commentData);
      loadUserProjects();
      return commentId;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }, [loadUserProjects]);

  const createSuggestion = useCallback(async (projectId: string, trackId: string, suggestionData: {
    type: 'audio_edit' | 'midi_change' | 'lyrics_revision' | 'arrangement_idea' | 'mix_suggestion';
    title: string;
    description: string;
    proposed_changes: Omit<Operation, 'id' | 'timestamp' | 'user_id'>[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    if (!collaborationManager.current) return null;

    try {
      const suggestionId = await collaborationManager.current.createSuggestion(projectId, trackId, suggestionData);
      loadUserProjects();
      return suggestionId;
    } catch (error) {
      console.error('Failed to create suggestion:', error);
      throw error;
    }
  }, [loadUserProjects]);

  const createVersion = useCallback(async (projectId: string, versionData: {
    version_number: string;
    name: string;
    description: string;
    is_release?: boolean;
    release_notes?: string;
  }) => {
    if (!collaborationManager.current) return null;

    try {
      const versionId = await collaborationManager.current.createVersion(projectId, versionData);
      loadUserProjects();
      return versionId;
    } catch (error) {
      console.error('Failed to create version:', error);
      throw error;
    }
  }, [loadUserProjects]);

  const updateCursor = useCallback(async (sessionId: string, position: {
    track_id: string;
    element_type: 'audio' | 'midi' | 'lyrics';
    position: number;
  }) => {
    if (!collaborationManager.current) return;

    try {
      await collaborationManager.current.updateCursor(sessionId, position);
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }, []);

  const getProjectAnalytics = useCallback(async (projectId: string, period: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    if (!collaborationManager.current) return null;

    try {
      return await collaborationManager.current.getProjectAnalytics(projectId, period);
    } catch (error) {
      console.error('Failed to get project analytics:', error);
      return null;
    }
  }, []);

  return {
    isInitialized,
    projects,
    activeSession,
    createProject,
    joinProject,
    createTrack,
    applyOperation,
    addComment,
    createSuggestion,
    createVersion,
    updateCursor,
    getProjectAnalytics,
    refreshProjects: loadUserProjects,
  };
}

/**
 * Hook for real-time collaboration features
 */
export function useRealTimeCollaboration(projectId?: string) {
  const { projects } = useCollaborativeCreation();
  const [liveCursors, setLiveCursors] = useState<LiveCursor[]>([]);
  const [activeSessions, setActiveSessions] = useState<CollaborationSession[]>([]);
  const [pendingOperations, setPendingOperations] = useState<Operation[]>([]);

  const project = projectId ? projects.find(p => p.id === projectId) : null;

  useEffect(() => {
    if (project) {
      setLiveCursors(project.live_cursors);
      setActiveSessions(project.active_sessions);
      setPendingOperations(project.pending_changes.map(pc => pc.operation));
    }
  }, [project]);

  const getCollaboratorCount = useCallback(() => {
    return activeSessions.filter(s => s.is_active).length;
  }, [activeSessions]);

  const getActiveCollaborators = useCallback(() => {
    return activeSessions.filter(s => s.is_active);
  }, [activeSessions]);

  const getCursorForUser = useCallback((userId: string) => {
    return liveCursors.find(c => c.user_id === userId);
  }, [liveCursors]);

  return {
    liveCursors,
    activeSessions,
    pendingOperations,
    getCollaboratorCount,
    getActiveCollaborators,
    getCursorForUser,
  };
}

/**
 * Hook for project analytics and insights
 */
export function useProjectAnalytics(projectId?: string) {
  const { getProjectAnalytics } = useCollaborativeCreation();
  const [analytics, setAnalytics] = useState<CollaborationAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(async (period: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    if (!projectId) return;

    setLoading(true);
    try {
      const data = await getProjectAnalytics(projectId, period);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, getProjectAnalytics]);

  return {
    analytics,
    loading,
    loadAnalytics,
  };
}

/**
 * Hook for version control operations
 */
export function useVersionControl(projectId?: string) {
  const { projects, createVersion } = useCollaborativeCreation();
  const [versions, setVersions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const project = projectId ? projects.find(p => p.id === projectId) : null;

  useEffect(() => {
    if (project) {
      setVersions(project.version_history);
      setBranches(project.branches);
    }
  }, [project]);

  const createNewVersion = useCallback(async (versionData: {
    version_number: string;
    name: string;
    description: string;
    is_release?: boolean;
    release_notes?: string;
  }) => {
    if (!projectId) return null;

    try {
      return await createVersion(projectId, versionData);
    } catch (error) {
      console.error('Failed to create version:', error);
      throw error;
    }
  }, [projectId, createVersion]);

  const getVersionDiff = useCallback((versionId1: string, versionId2: string) => {
    // Mock implementation - would calculate actual diff
    return {
      added_tracks: [],
      modified_tracks: [],
      deleted_tracks: [],
      metadata_changes: [],
    };
  }, []);

  const revertToVersion = useCallback(async (versionId: string) => {
    // Mock implementation - would revert project to specific version
    console.log(`Reverting to version: ${versionId}`);
    return true;
  }, []);

  return {
    versions,
    branches,
    currentVersion: project?.current_version,
    createNewVersion,
    getVersionDiff,
    revertToVersion,
  };
}
