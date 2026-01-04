"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { BattlesManager } from '@/lib/battles/battlesManager';
import { BattleCreationWizardManager } from '@/lib/battles/battleCreationWizard';
import { BattleRecapGenerator } from '@/lib/battles/recapGenerator';
import { 
  Battle, 
  Vote, 
  BattleAnalytics, 
  BattleCreationWizard,
  BattleRecap 
} from '@/lib/battles/types';
import { Track } from '@/types/track';
import { useAuth } from './useAuth';

/**
 * Hook for battles functionality
 */
export function useBattles() {
  const { user } = useAuth();
  const battlesManager = useRef<BattlesManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [battles, setBattles] = useState<Battle[]>([]);

  const loadBattles = useCallback(() => {
    if (battlesManager.current) {
      const allBattles = battlesManager.current.getAllBattles();
      setBattles(allBattles);
    }
  }, []);

  // Initialize battles manager
  useEffect(() => {
    if (user?.id && !battlesManager.current) {
      battlesManager.current = new BattlesManager(user.id);
      setIsInitialized(true);
    }
    if (user?.id) {
      loadBattles();
    }
  }, [loadBattles, user?.id]);

  const createBattle = useCallback(async (battleData: Partial<Battle>) => {
    if (!battlesManager.current) return null;

    try {
      const battle = await battlesManager.current.createBattle(battleData);
      loadBattles();
      return battle;
    } catch (error) {
      console.error('Failed to create battle:', error);
      throw error;
    }
  }, [loadBattles]);

  const addTrackToBattle = useCallback(async (battleId: string, track: Track) => {
    if (!battlesManager.current) return;

    try {
      await battlesManager.current.addTrackToBattle(battleId, track);
      loadBattles();
    } catch (error) {
      console.error('Failed to add track to battle:', error);
      throw error;
    }
  }, [loadBattles]);

  const castVote = useCallback(async (battleId: string, trackId: string) => {
    if (!battlesManager.current) return null;

    try {
      const vote = await battlesManager.current.castVote(battleId, trackId);
      loadBattles();
      return vote;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      throw error;
    }
  }, [loadBattles]);

  const startVoting = useCallback(async (battleId: string) => {
    if (!battlesManager.current) return;

    try {
      await battlesManager.current.startVoting(battleId);
      loadBattles();
    } catch (error) {
      console.error('Failed to start voting:', error);
      throw error;
    }
  }, [loadBattles]);

  const endBattle = useCallback(async (battleId: string) => {
    if (!battlesManager.current) return null;

    try {
      const results = await battlesManager.current.endBattle(battleId);
      loadBattles();
      return results;
    } catch (error) {
      console.error('Failed to end battle:', error);
      throw error;
    }
  }, [loadBattles]);

  const getBattle = useCallback((battleId: string) => {
    if (!battlesManager.current) return null;
    return battlesManager.current.getBattle(battleId);
  }, []);

  const getBattlesByStatus = useCallback((status: Battle['status']) => {
    if (!battlesManager.current) return [];
    return battlesManager.current.getBattlesByStatus(status);
  }, []);

  const getUserVote = useCallback((battleId: string) => {
    if (!battlesManager.current) return null;
    return battlesManager.current.getUserVoteInBattle(battleId);
  }, []);

  const getBattleAnalytics = useCallback((battleId: string) => {
    if (!battlesManager.current) return null;
    return battlesManager.current.getBattleAnalytics(battleId);
  }, []);

  return {
    isInitialized,
    battles,
    createBattle,
    addTrackToBattle,
    castVote,
    startVoting,
    endBattle,
    getBattle,
    getBattlesByStatus,
    getUserVote,
    getBattleAnalytics,
    refreshBattles: loadBattles,
  };
}

/**
 * Hook for battle creation wizard
 */
export function useBattleCreationWizard() {
  const wizardManager = useRef<BattleCreationWizardManager>(new BattleCreationWizardManager());
  const [wizardState, setWizardState] = useState<BattleCreationWizard>(wizardManager.current.getState());

  const updateData = useCallback((data: Partial<Battle>) => {
    wizardManager.current.updateData(data);
    setWizardState(wizardManager.current.getState());
  }, []);

  const nextStep = useCallback(() => {
    const success = wizardManager.current.nextStep();
    setWizardState(wizardManager.current.getState());
    return success;
  }, []);

  const previousStep = useCallback(() => {
    const success = wizardManager.current.previousStep();
    setWizardState(wizardManager.current.getState());
    return success;
  }, []);

  const goToStep = useCallback((step: BattleCreationWizard['step']) => {
    wizardManager.current.goToStep(step);
    setWizardState(wizardManager.current.getState());
  }, []);

  const canProceed = useCallback(() => {
    return wizardManager.current.canProceedToNext();
  }, []);

  const getCompletionPercentage = useCallback(() => {
    return wizardManager.current.getCompletionPercentage();
  }, []);

  const getRecommendedVotingConfig = useCallback((battleType: Battle['type']) => {
    return wizardManager.current.getRecommendedVotingConfig(battleType);
  }, []);

  const reset = useCallback(() => {
    wizardManager.current.reset();
    setWizardState(wizardManager.current.getState());
  }, []);

  const exportData = useCallback(() => {
    return wizardManager.current.exportBattleData();
  }, []);

  return {
    wizardState,
    updateData,
    nextStep,
    previousStep,
    goToStep,
    canProceed,
    getCompletionPercentage,
    getRecommendedVotingConfig,
    reset,
    exportData,
  };
}

/**
 * Hook for battle analytics
 */
export function useBattleAnalytics(battleId: string) {
  const { getBattleAnalytics } = useBattles();
  const [analytics, setAnalytics] = useState<BattleAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshAnalytics = useCallback(() => {
    if (!battleId) return;

    setLoading(true);
    try {
      const data = getBattleAnalytics(battleId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [battleId, getBattleAnalytics]);

  // Auto-refresh analytics
  useEffect(() => {
    refreshAnalytics();
    const interval = setInterval(refreshAnalytics, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [refreshAnalytics]);

  return {
    analytics,
    loading,
    refreshAnalytics,
  };
}

/**
 * Hook for battle recap generation
 */
export function useBattleRecap() {
  const recapGenerator = useRef<BattleRecapGenerator>(new BattleRecapGenerator());
  const [recaps, setRecaps] = useState<Map<string, BattleRecap>>(new Map());
  const [generating, setGenerating] = useState<Set<string>>(new Set());

  const generateRecap = useCallback(async (battle: Battle, votes: Vote[]) => {
    if (generating.has(battle.id)) return null;

    setGenerating(prev => new Set(prev).add(battle.id));

    try {
      const recap = await recapGenerator.current.generateRecap(battle, votes);
      setRecaps(prev => new Map(prev).set(battle.id, recap));
      return recap;
    } catch (error) {
      console.error('Failed to generate recap:', error);
      throw error;
    } finally {
      setGenerating(prev => {
        const newSet = new Set(prev);
        newSet.delete(battle.id);
        return newSet;
      });
    }
  }, [generating]);

  const getRecap = useCallback((battleId: string) => {
    return recaps.get(battleId);
  }, [recaps]);

  const isGenerating = useCallback((battleId: string) => {
    return generating.has(battleId);
  }, [generating]);

  return {
    generateRecap,
    getRecap,
    isGenerating,
    recaps: Array.from(recaps.values()),
  };
}

/**
 * Hook for vote management
 */
export function useVoting(battleId: string) {
  const { castVote, getUserVote, getBattle } = useBattles();
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [canVote, setCanVote] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Check voting eligibility
  useEffect(() => {
    const battle = getBattle(battleId);
    const vote = getUserVote(battleId);
    
    setUserVote(vote ?? null);
    
    if (!battle) {
      setCanVote(false);
      return;
    }

    const now = Date.now();
    const isVotingPhase = battle.status === 'voting';
    const isInVotingWindow = now >= battle.voting_starts_at && now <= battle.voting_ends_at;
    const hasNotVoted = !vote || battle.voting_config.allow_vote_changes;

    setCanVote(isVotingPhase && isInVotingWindow && hasNotVoted);
  }, [battleId, getBattle, getUserVote]);

  const vote = useCallback(async (trackId: string) => {
    setVoteError(null);

    try {
      const newVote = await castVote(battleId, trackId);
      setUserVote(newVote);
      return newVote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cast vote';
      setVoteError(errorMessage);
      throw error;
    }
  }, [battleId, castVote]);

  return {
    userVote,
    canVote,
    voteError,
    vote,
  };
}
