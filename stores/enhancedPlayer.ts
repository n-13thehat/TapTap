/**
 * Enhanced Global Player Store
 * Unified, feature-rich player with advanced audio capabilities
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AdvancedAudioEffects } from '@/lib/audio/effects/AdvancedAudioEffects';
import { AIAudioProcessor } from '@/lib/audio/ai/AIAudioProcessor';
import { AdvancedVisualizer } from '@/lib/audio/visualizations/AdvancedVisualizer';
import { eventBus, EventTypes } from '@/lib/events/eventBus';
import { checkHavenPolicy, logPolicyViolation } from '@/lib/haven/policy';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  audio_url: string;
  cover_url?: string;
  genre?: string;
  year?: number;
  bpm?: number;
  key?: string;
  energy?: number;
  valence?: number;
  danceability?: number;
  loudness?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface PlaybackState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  currentTime: number;
  duration: number;
  buffered: TimeRanges | null;
  playbackRate: number;
  error: string | null;
  isLoading: boolean;
  canPlay: boolean;
  seeking: boolean;
}

export interface QueueState {
  tracks: Track[];
  currentIndex: number;
  originalOrder: Track[]; // For shuffle mode
  history: Track[];
  upNext: Track[];
  autoQueue: Track[]; // AI-generated recommendations
}

export interface AudioSettings {
  volume: number;
  muted: boolean;
  crossfadeDuration: number;
  gaplessPlayback: boolean;
  normalizeVolume: boolean;
  replayGain: boolean;
  outputDevice?: string;
  sampleRate?: number;
  bitDepth?: number;
}

export interface PlaybackModes {
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  autoplay: boolean;
  smartShuffle: boolean; // AI-powered shuffle
  partyMode: boolean; // Collaborative queue
  djMode: boolean; // Auto-mix mode
}

export interface VisualizationSettings {
  enabled: boolean;
  type: 'spectrum' | 'waveform' | 'circular' | '3d' | 'particle' | 'oscilloscope';
  colorScheme: string;
  sensitivity: number;
  showPeaks: boolean;
  showGrid: boolean;
  showLabels: boolean;
  fullscreen: boolean;
}

export interface EffectsSettings {
  enabled: boolean;
  chain: string[];
  presets: Record<string, any>;
  masterVolume: number;
  masterEQ: {
    low: number;
    mid: number;
    high: number;
  };
}

export interface AISettings {
  enabled: boolean;
  autoEnhancement: boolean;
  sourceSeparation: boolean;
  smartMastering: boolean;
  autoAnalysis: boolean;
  recommendations: boolean;
  adaptiveEQ: boolean;
}

export interface UIState {
  showPlayer: boolean;
  showQueue: boolean;
  showLyrics: boolean;
  showVisualizer: boolean;
  showEffects: boolean;
  showAI: boolean;
  playerSize: 'mini' | 'compact' | 'full' | 'theater';
  theme: 'dark' | 'light' | 'auto';
  layout: 'bottom' | 'sidebar' | 'overlay' | 'floating';
}

export interface SocialFeatures {
  liveChat: boolean;
  reactions: boolean;
  sharing: boolean;
  collaborative: boolean;
  broadcasting: boolean;
  listeners: number;
  chatMessages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'message' | 'reaction' | 'system';
  trackTime?: number;
}

export interface PlayerAnalytics {
  playCount: number;
  skipCount: number;
  totalPlayTime: number;
  averageSessionLength: number;
  favoriteGenres: string[];
  listeningHabits: Record<string, number>;
  qualityMetrics: {
    bufferHealth: number;
    dropouts: number;
    latency: number;
  };
}

export interface EnhancedPlayerState {
  // Core playback
  currentTrack: Track | null;
  playback: PlaybackState;
  queue: QueueState;
  
  // Audio & Effects
  audioSettings: AudioSettings;
  playbackModes: PlaybackModes;
  visualization: VisualizationSettings;
  effects: EffectsSettings;
  ai: AISettings;
  
  // UI & Social
  ui: UIState;
  social: SocialFeatures;
  analytics: PlayerAnalytics;
  
  // Audio Context & Processors
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
  effectsProcessor: AdvancedAudioEffects | null;
  aiProcessor: AIAudioProcessor | null;
  visualizer: AdvancedVisualizer | null;
  
  // Crossfade & Gapless
  nextAudioElement: HTMLAudioElement | null;
  crossfadeGain: GainNode | null;
  currentGain: GainNode | null;
  nextGain: GainNode | null;
  
  // Performance
  isInitialized: boolean;
  lastError: string | null;
  performanceMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    audioLatency: number;
    bufferHealth: number;
  };
}

// ============================================================================
// Actions Interface
// ============================================================================

export interface EnhancedPlayerActions {
  // Initialization
  initialize: () => Promise<void>;
  destroy: () => void;
  
  // Playback Controls
  play: (track?: Track) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  
  // Queue Management
  addToQueue: (track: Track, position?: 'next' | 'end') => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  
  // Navigation
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  skipToTrack: (index: number) => Promise<void>;
  
  // Audio Settings
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCrossfadeDuration: (duration: number) => void;
  toggleGaplessPlayback: () => void;
  toggleNormalizeVolume: () => void;
  
  // Playback Modes
  toggleShuffle: () => void;
  setRepeat: (mode: 'none' | 'one' | 'all') => void;
  toggleAutoplay: () => void;
  toggleSmartShuffle: () => void;
  togglePartyMode: () => void;
  toggleDJMode: () => void;
  
  // Visualization
  toggleVisualizer: () => void;
  setVisualizationType: (type: VisualizationSettings['type']) => void;
  setVisualizationColorScheme: (scheme: string) => void;
  toggleVisualizationFullscreen: () => void;
  
  // Effects
  toggleEffects: () => void;
  addEffect: (effectId: string) => void;
  removeEffect: (effectId: string) => void;
  reorderEffects: (fromIndex: number, toIndex: number) => void;
  setEffectParameter: (effectId: string, parameterId: string, value: number) => void;
  loadEffectPreset: (effectId: string, presetId: string) => void;
  
  // AI Features
  toggleAI: () => void;
  analyzeCurrentTrack: () => Promise<void>;
  enhanceCurrentTrack: () => Promise<void>;
  separateCurrentTrack: () => Promise<void>;
  masterCurrentTrack: () => Promise<void>;
  getRecommendations: () => Promise<Track[]>;
  
  // UI Controls
  setPlayerSize: (size: UIState['playerSize']) => void;
  setPlayerLayout: (layout: UIState['layout']) => void;
  toggleQueue: () => void;
  toggleLyrics: () => void;
  toggleEffectsPanel: () => void;
  toggleAIPanel: () => void;
  
  // Social Features
  toggleLiveChat: () => void;
  sendChatMessage: (message: string) => void;
  addReaction: (emoji: string) => void;
  shareTrack: (platform: string) => void;
  startBroadcast: () => void;
  stopBroadcast: () => void;
  
  // Persistence
  saveState: () => Promise<void>;
  loadState: () => Promise<void>;
  exportPlaylist: () => Promise<string>;
  importPlaylist: (data: string) => Promise<void>;
}

type EnhancedPlayerStore = EnhancedPlayerState & EnhancedPlayerActions;

// ============================================================================
// Default State
// ============================================================================

const defaultPlaybackState: PlaybackState = {
  status: 'idle',
  currentTime: 0,
  duration: 0,
  buffered: null,
  playbackRate: 1,
  error: null,
  isLoading: false,
  canPlay: false,
  seeking: false,
};

const defaultQueueState: QueueState = {
  tracks: [],
  currentIndex: -1,
  originalOrder: [],
  history: [],
  upNext: [],
  autoQueue: [],
};

const defaultAudioSettings: AudioSettings = {
  volume: 0.8,
  muted: false,
  crossfadeDuration: 3,
  gaplessPlayback: true,
  normalizeVolume: false,
  replayGain: false,
};

const defaultPlaybackModes: PlaybackModes = {
  shuffle: false,
  repeat: 'none',
  autoplay: true,
  smartShuffle: false,
  partyMode: false,
  djMode: false,
};

const defaultVisualizationSettings: VisualizationSettings = {
  enabled: true,
  type: 'spectrum',
  colorScheme: 'teal',
  sensitivity: 0.8,
  showPeaks: true,
  showGrid: false,
  showLabels: true,
  fullscreen: false,
};

const defaultEffectsSettings: EffectsSettings = {
  enabled: false,
  chain: [],
  presets: {},
  masterVolume: 1.0,
  masterEQ: {
    low: 0,
    mid: 0,
    high: 0,
  },
};

const defaultAISettings: AISettings = {
  enabled: true,
  autoEnhancement: false,
  sourceSeparation: false,
  smartMastering: false,
  autoAnalysis: true,
  recommendations: true,
  adaptiveEQ: false,
};

const defaultUIState: UIState = {
  showPlayer: true,
  showQueue: false,
  showLyrics: false,
  showVisualizer: false,
  showEffects: false,
  showAI: false,
  playerSize: 'compact',
  theme: 'dark',
  layout: 'bottom',
};

const defaultSocialFeatures: SocialFeatures = {
  liveChat: false,
  reactions: true,
  sharing: true,
  collaborative: false,
  broadcasting: false,
  listeners: 0,
  chatMessages: [],
};

const defaultAnalytics: PlayerAnalytics = {
  playCount: 0,
  skipCount: 0,
  totalPlayTime: 0,
  averageSessionLength: 0,
  favoriteGenres: [],
  listeningHabits: {},
  qualityMetrics: {
    bufferHealth: 100,
    dropouts: 0,
    latency: 0,
  },
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useEnhancedPlayerStore = create<EnhancedPlayerStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // State
      currentTrack: null,
      playback: defaultPlaybackState,
      queue: defaultQueueState,
      audioSettings: defaultAudioSettings,
      playbackModes: defaultPlaybackModes,
      visualization: defaultVisualizationSettings,
      effects: defaultEffectsSettings,
      ai: defaultAISettings,
      ui: defaultUIState,
      social: defaultSocialFeatures,
      analytics: defaultAnalytics,
      
      // Audio Context & Processors
      audioContext: null,
      audioElement: null,
      effectsProcessor: null,
      aiProcessor: null,
      visualizer: null,
      
      // Crossfade & Gapless
      nextAudioElement: null,
      crossfadeGain: null,
      currentGain: null,
      nextGain: null,
      
      // Performance
      isInitialized: false,
      lastError: null,
      performanceMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        audioLatency: 0,
        bufferHealth: 100,
      },

      // ========================================================================
      // Initialization
      // ========================================================================

      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        try {
          // Initialize Audio Context
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            latencyHint: 'interactive',
            sampleRate: 44100,
          });

          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          // Create audio elements
          const audioElement = new Audio();
          const nextAudioElement = new Audio();
          
          audioElement.crossOrigin = 'anonymous';
          audioElement.preload = 'metadata';
          nextAudioElement.crossOrigin = 'anonymous';
          nextAudioElement.preload = 'metadata';

          // Create gain nodes for crossfading
          const currentGain = audioContext.createGain();
          const nextGain = audioContext.createGain();
          const crossfadeGain = audioContext.createGain();

          // Connect audio graph
          const currentSource = audioContext.createMediaElementSource(audioElement);
          const nextSource = audioContext.createMediaElementSource(nextAudioElement);
          
          currentSource.connect(currentGain);
          nextSource.connect(nextGain);
          currentGain.connect(crossfadeGain);
          nextGain.connect(crossfadeGain);

          // Initialize processors
          const effectsProcessor = new AdvancedAudioEffects(audioContext);
          const aiProcessor = new AIAudioProcessor(audioContext);

          // Connect effects chain
          const effectsOutput = effectsProcessor.connect(crossfadeGain);
          effectsOutput.connect(audioContext.destination);

          set((state) => ({
            ...state,
            audioContext: audioContext,
            audioElement: audioElement,
            nextAudioElement: nextAudioElement,
            currentGain: currentGain,
            nextGain: nextGain,
            crossfadeGain: crossfadeGain,
            effectsProcessor: effectsProcessor,
            aiProcessor: aiProcessor,
            isInitialized: true,
          }));

          // Set up event listeners
          get().setupEventListeners();

          // Load persisted state
          await get().loadState();

          console.log('Enhanced Player initialized successfully');

        } catch (error) {
          console.error('Failed to initialize Enhanced Player:', error);
          set((draft) => {
            draft.lastError = `Initialization failed: ${error}`;
          });
        }
      },

      destroy: () => {
        const state = get();
        
        if (state.audioContext) {
          state.audioContext.close();
        }
        
        if (state.audioElement) {
          state.audioElement.pause();
          state.audioElement.src = '';
        }
        
        if (state.nextAudioElement) {
          state.nextAudioElement.pause();
          state.nextAudioElement.src = '';
        }
        
        if (state.effectsProcessor) {
          state.effectsProcessor.disconnect();
        }
        
        if (state.aiProcessor) {
          state.aiProcessor.destroy();
        }
        
        if (state.visualizer) {
          state.visualizer.destroy();
        }

        set((draft) => {
          draft.isInitialized = false;
          draft.audioContext = null;
          draft.audioElement = null;
          draft.nextAudioElement = null;
          draft.effectsProcessor = null;
          draft.aiProcessor = null;
          draft.visualizer = null;
        });
      },

      // ========================================================================
      // Playback Controls
      // ========================================================================

      play: async (track?: Track) => {
        const state = get();
        if (!state.isInitialized) {
          await get().initialize();
        }

        try {
          let targetTrack = track;
          
          if (!targetTrack) {
            if (state.currentTrack) {
              targetTrack = state.currentTrack;
            } else if (state.queue.tracks.length > 0) {
              targetTrack = state.queue.tracks[Math.max(0, state.queue.currentIndex)];
            } else {
              return;
            }
          }

          // Haven policy check
          const policyResult = checkHavenPolicy({
            id: targetTrack.id,
            type: 'track',
            title: targetTrack.title,
            metadata: { artist: targetTrack.artist }
          });

          if (!policyResult.allowed) {
            logPolicyViolation({
              id: targetTrack.id,
              type: 'track',
              title: targetTrack.title,
              metadata: { artist: targetTrack.artist }
            }, policyResult);
            
            set((draft) => {
              draft.lastError = `Track blocked: ${policyResult.reason}`;
            });
            return;
          }

          set((draft) => {
            draft.playback.status = 'loading';
            draft.playback.isLoading = true;
            draft.currentTrack = targetTrack;
          });

          // Load track
          if (state.audioElement && targetTrack.audio_url) {
            state.audioElement.src = targetTrack.audio_url;
            state.audioElement.volume = state.audioSettings.muted ? 0 : state.audioSettings.volume;
            
            await state.audioElement.play();
            
            set((draft) => {
              draft.playback.status = 'playing';
              draft.playback.isLoading = false;
              draft.playback.canPlay = true;
            });

            // Update analytics
            set((draft) => {
              draft.analytics.playCount++;
            });

            // Emit events
            eventBus.emit(EventTypes.TRACK_PLAYED, {
              trackId: targetTrack.id,
              title: targetTrack.title,
              artist: targetTrack.artist,
              duration: targetTrack.duration,
            });

            // Auto-analyze if enabled
            if (state.ai.enabled && state.ai.autoAnalysis) {
              setTimeout(() => get().analyzeCurrentTrack(), 1000);
            }

            // Prepare next track for gapless playback
            if (state.audioSettings.gaplessPlayback) {
              get().prepareNextTrack();
            }
          }

        } catch (error) {
          console.error('Playback failed:', error);
          set((draft) => {
            draft.playback.status = 'error';
            draft.playback.error = `Playback failed: ${error}`;
            draft.playback.isLoading = false;
          });
        }
      },

      pause: () => {
        const state = get();
        if (state.audioElement) {
          state.audioElement.pause();
          set((draft) => {
            draft.playback.status = 'paused';
          });
        }
      },

      stop: () => {
        const state = get();
        if (state.audioElement) {
          state.audioElement.pause();
          state.audioElement.currentTime = 0;
          set((draft) => {
            draft.playback.status = 'idle';
            draft.playback.currentTime = 0;
          });
        }
      },

      seek: (time: number) => {
        const state = get();
        if (state.audioElement && state.playback.duration > 0) {
          const clampedTime = Math.max(0, Math.min(time, state.playback.duration));
          state.audioElement.currentTime = clampedTime;
          set((draft) => {
            draft.playback.currentTime = clampedTime;
            draft.playback.seeking = true;
          });
          
          // Clear seeking flag after a short delay
          setTimeout(() => {
            set((draft) => {
              draft.playback.seeking = false;
            });
          }, 100);
        }
      },

      setPlaybackRate: (rate: number) => {
        const state = get();
        const clampedRate = Math.max(0.25, Math.min(4, rate));
        
        if (state.audioElement) {
          state.audioElement.playbackRate = clampedRate;
          set((draft) => {
            draft.playback.playbackRate = clampedRate;
          });
        }
      },

      // ========================================================================
      // Queue Management
      // ========================================================================

      addToQueue: (track: Track, position: 'next' | 'end' = 'end') => {
        set((draft) => {
          if (position === 'next') {
            const insertIndex = draft.queue.currentIndex + 1;
            draft.queue.tracks.splice(insertIndex, 0, track);
          } else {
            draft.queue.tracks.push(track);
          }
        });
        get().saveState();
      },

      removeFromQueue: (index: number) => {
        set((draft) => {
          if (index >= 0 && index < draft.queue.tracks.length) {
            draft.queue.tracks.splice(index, 1);
            
            // Adjust current index if necessary
            if (index < draft.queue.currentIndex) {
              draft.queue.currentIndex--;
            } else if (index === draft.queue.currentIndex && draft.queue.tracks.length > 0) {
              // If we removed the current track, stay at the same index (which now points to the next track)
              if (draft.queue.currentIndex >= draft.queue.tracks.length) {
                draft.queue.currentIndex = draft.queue.tracks.length - 1;
              }
            }
          }
        });
        get().saveState();
      },

      reorderQueue: (fromIndex: number, toIndex: number) => {
        set((draft) => {
          const tracks = draft.queue.tracks;
          if (fromIndex >= 0 && fromIndex < tracks.length && toIndex >= 0 && toIndex < tracks.length) {
            const [movedTrack] = tracks.splice(fromIndex, 1);
            tracks.splice(toIndex, 0, movedTrack);
            
            // Adjust current index
            if (fromIndex === draft.queue.currentIndex) {
              draft.queue.currentIndex = toIndex;
            } else if (fromIndex < draft.queue.currentIndex && toIndex >= draft.queue.currentIndex) {
              draft.queue.currentIndex--;
            } else if (fromIndex > draft.queue.currentIndex && toIndex <= draft.queue.currentIndex) {
              draft.queue.currentIndex++;
            }
          }
        });
        get().saveState();
      },

      clearQueue: () => {
        set((draft) => {
          draft.queue.tracks = [];
          draft.queue.currentIndex = -1;
          draft.queue.history = [];
          draft.queue.upNext = [];
          draft.currentTrack = null;
        });
        get().stop();
        get().saveState();
      },

      shuffleQueue: () => {
        set((draft) => {
          const currentTrack = draft.currentTrack;
          const tracks = [...draft.queue.tracks];
          
          // Save original order if not already shuffled
          if (!draft.playbackModes.shuffle) {
            draft.queue.originalOrder = [...tracks];
          }
          
          // Shuffle algorithm (Fisher-Yates)
          for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
          }
          
          // Find new index of current track
          const newIndex = currentTrack ? tracks.findIndex(t => t.id === currentTrack.id) : -1;
          
          draft.queue.tracks = tracks;
          draft.queue.currentIndex = newIndex;
          draft.playbackModes.shuffle = true;
        });
        get().saveState();
      },

      // ========================================================================
      // Navigation
      // ========================================================================

      skipNext: async () => {
        const state = get();
        const { queue, playbackModes } = state;
        
        if (queue.tracks.length === 0) return;
        
        let nextIndex = queue.currentIndex;
        
        if (playbackModes.shuffle || playbackModes.smartShuffle) {
          // Smart shuffle considers listening history and preferences
          if (playbackModes.smartShuffle && state.ai.enabled) {
            nextIndex = get().getSmartShuffleIndex();
          } else {
            nextIndex = Math.floor(Math.random() * queue.tracks.length);
          }
        } else {
          nextIndex = queue.currentIndex + 1;
          
          if (nextIndex >= queue.tracks.length) {
            if (playbackModes.repeat === 'all') {
              nextIndex = 0;
            } else {
              return; // End of queue
            }
          }
        }
        
        const nextTrack = queue.tracks[nextIndex];
        if (nextTrack) {
          // Add current track to history
          if (state.currentTrack) {
            set((draft) => {
              draft.queue.history.unshift(state.currentTrack!);
              if (draft.queue.history.length > 50) {
                draft.queue.history = draft.queue.history.slice(0, 50);
              }
            });
          }
          
          set((draft) => {
            draft.queue.currentIndex = nextIndex;
          });
          
          await get().play(nextTrack);
        }
      },

      skipPrevious: async () => {
        const state = get();
        
        // If we're more than 3 seconds into the track, restart it
        if (state.playback.currentTime > 3) {
          get().seek(0);
          return;
        }
        
        // Go to previous track in history or queue
        if (state.queue.history.length > 0) {
          const previousTrack = state.queue.history[0];
          set((draft) => {
            draft.queue.history = draft.queue.history.slice(1);
          });
          await get().play(previousTrack);
        } else if (state.queue.currentIndex > 0) {
          const previousIndex = state.queue.currentIndex - 1;
          const previousTrack = state.queue.tracks[previousIndex];
          
          set((draft) => {
            draft.queue.currentIndex = previousIndex;
          });
          
          await get().play(previousTrack);
        }
      },

      skipToTrack: async (index: number) => {
        const state = get();
        if (index >= 0 && index < state.queue.tracks.length) {
          const track = state.queue.tracks[index];
          
          set((draft) => {
            draft.queue.currentIndex = index;
          });
          
          await get().play(track);
        }
      },

      // ========================================================================
      // Audio Settings
      // ========================================================================

      setVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        const state = get();
        
        if (state.audioElement) {
          state.audioElement.volume = state.audioSettings.muted ? 0 : clampedVolume;
        }
        
        set((draft) => {
          draft.audioSettings.volume = clampedVolume;
        });
        
        get().saveState();
      },

      toggleMute: () => {
        const state = get();
        const newMuted = !state.audioSettings.muted;
        
        if (state.audioElement) {
          state.audioElement.volume = newMuted ? 0 : state.audioSettings.volume;
        }
        
        set((draft) => {
          draft.audioSettings.muted = newMuted;
        });
        
        get().saveState();
      },

      setCrossfadeDuration: (duration: number) => {
        const clampedDuration = Math.max(0, Math.min(10, duration));
        set((draft) => {
          draft.audioSettings.crossfadeDuration = clampedDuration;
        });
        get().saveState();
      },

      toggleGaplessPlayback: () => {
        set((draft) => {
          draft.audioSettings.gaplessPlayback = !draft.audioSettings.gaplessPlayback;
        });
        get().saveState();
      },

      toggleNormalizeVolume: () => {
        set((draft) => {
          draft.audioSettings.normalizeVolume = !draft.audioSettings.normalizeVolume;
        });
        get().saveState();
      },

      // ========================================================================
      // Playback Modes
      // ========================================================================

      toggleShuffle: () => {
        const state = get();
        const newShuffle = !state.playbackModes.shuffle;
        
        if (newShuffle) {
          get().shuffleQueue();
        } else {
          // Restore original order
          set((draft) => {
            if (draft.queue.originalOrder.length > 0) {
              const currentTrack = draft.currentTrack;
              draft.queue.tracks = [...draft.queue.originalOrder];
              draft.queue.currentIndex = currentTrack 
                ? draft.queue.tracks.findIndex(t => t.id === currentTrack.id)
                : -1;
            }
            draft.playbackModes.shuffle = false;
          });
        }
        
        get().saveState();
      },

      setRepeat: (mode: 'none' | 'one' | 'all') => {
        set((draft) => {
          draft.playbackModes.repeat = mode;
        });
        get().saveState();
      },

      toggleAutoplay: () => {
        set((draft) => {
          draft.playbackModes.autoplay = !draft.playbackModes.autoplay;
        });
        get().saveState();
      },

      toggleSmartShuffle: () => {
        set((draft) => {
          draft.playbackModes.smartShuffle = !draft.playbackModes.smartShuffle;
        });
        get().saveState();
      },

      togglePartyMode: () => {
        set((draft) => {
          draft.playbackModes.partyMode = !draft.playbackModes.partyMode;
        });
        get().saveState();
      },

      toggleDJMode: () => {
        set((draft) => {
          draft.playbackModes.djMode = !draft.playbackModes.djMode;
        });
        get().saveState();
      },

      // ========================================================================
      // Visualization
      // ========================================================================

      toggleVisualizer: () => {
        set((draft) => {
          draft.visualization.enabled = !draft.visualization.enabled;
          draft.ui.showVisualizer = draft.visualization.enabled;
        });
      },

      setVisualizationType: (type: VisualizationSettings['type']) => {
        set((draft) => {
          draft.visualization.type = type;
        });
      },

      setVisualizationColorScheme: (scheme: string) => {
        set((draft) => {
          draft.visualization.colorScheme = scheme;
        });
      },

      toggleVisualizationFullscreen: () => {
        set((draft) => {
          draft.visualization.fullscreen = !draft.visualization.fullscreen;
        });
      },

      // ========================================================================
      // Effects
      // ========================================================================

      toggleEffects: () => {
        set((draft) => {
          draft.effects.enabled = !draft.effects.enabled;
          draft.ui.showEffects = draft.effects.enabled;
        });
      },

      addEffect: (effectId: string) => {
        const state = get();
        if (state.effectsProcessor) {
          state.effectsProcessor.enableEffect(effectId);
          set((draft) => {
            if (!draft.effects.chain.includes(effectId)) {
              draft.effects.chain.push(effectId);
            }
          });
        }
      },

      removeEffect: (effectId: string) => {
        const state = get();
        if (state.effectsProcessor) {
          state.effectsProcessor.disableEffect(effectId);
          set((draft) => {
            draft.effects.chain = draft.effects.chain.filter(id => id !== effectId);
          });
        }
      },

      reorderEffects: (fromIndex: number, toIndex: number) => {
        set((draft) => {
          const chain = draft.effects.chain;
          if (fromIndex >= 0 && fromIndex < chain.length && toIndex >= 0 && toIndex < chain.length) {
            const [movedEffect] = chain.splice(fromIndex, 1);
            chain.splice(toIndex, 0, movedEffect);
          }
        });
        
        const state = get();
        if (state.effectsProcessor) {
          state.effectsProcessor.setEffectChainOrder(state.effects.chain);
        }
      },

      setEffectParameter: (effectId: string, parameterId: string, value: number) => {
        const state = get();
        if (state.effectsProcessor) {
          state.effectsProcessor.setEffectParameter(effectId, parameterId, value);
        }
      },

      loadEffectPreset: (effectId: string, presetId: string) => {
        const state = get();
        if (state.effectsProcessor) {
          state.effectsProcessor.loadPreset(effectId, presetId);
        }
      },

      // ========================================================================
      // AI Features
      // ========================================================================

      toggleAI: () => {
        set((draft) => {
          draft.ai.enabled = !draft.ai.enabled;
          draft.ui.showAI = draft.ai.enabled;
        });
      },

      analyzeCurrentTrack: async () => {
        const state = get();
        if (!state.aiProcessor || !state.audioElement || !state.currentTrack) return;

        try {
          // Get audio buffer from current track
          const response = await fetch(state.currentTrack.audio_url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await state.audioContext!.decodeAudioData(arrayBuffer);
          
          const analysis = await state.aiProcessor.analyzeAudio(audioBuffer);
          
          // Update track metadata with analysis
          set((draft) => {
            if (draft.currentTrack) {
              draft.currentTrack.metadata = {
                ...draft.currentTrack.metadata,
                analysis,
              };
            }
          });
          
        } catch (error) {
          console.error('AI analysis failed:', error);
        }
      },

      enhanceCurrentTrack: async () => {
        const state = get();
        if (!state.aiProcessor || !state.audioElement || !state.currentTrack) return;

        try {
          const response = await fetch(state.currentTrack.audio_url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await state.audioContext!.decodeAudioData(arrayBuffer);
          
          const enhancement = await state.aiProcessor.enhanceAudio(audioBuffer, {
            noiseReduction: true,
            clarityEnhancement: true,
            dynamicRangeExpansion: true,
          });
          
          // Apply enhanced audio (this would require more complex implementation)
          console.log('Enhancement completed:', enhancement);
          
        } catch (error) {
          console.error('AI enhancement failed:', error);
        }
      },

      separateCurrentTrack: async () => {
        const state = get();
        if (!state.aiProcessor || !state.audioElement || !state.currentTrack) return;

        try {
          const response = await fetch(state.currentTrack.audio_url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await state.audioContext!.decodeAudioData(arrayBuffer);
          
          const separation = await state.aiProcessor.separateAudioSources(audioBuffer);
          
          console.log('Source separation completed:', separation);
          
        } catch (error) {
          console.error('AI source separation failed:', error);
        }
      },

      masterCurrentTrack: async () => {
        const state = get();
        if (!state.aiProcessor || !state.audioElement || !state.currentTrack) return;

        try {
          const response = await fetch(state.currentTrack.audio_url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await state.audioContext!.decodeAudioData(arrayBuffer);
          
          const mastering = await state.aiProcessor.masterAudio(audioBuffer, {
            targetLUFS: -14,
            peakLevel: -1,
          });
          
          console.log('AI mastering completed:', mastering);
          
        } catch (error) {
          console.error('AI mastering failed:', error);
        }
      },

      getRecommendations: async (): Promise<Track[]> => {
        // This would integrate with recommendation API
        return [];
      },

      // ========================================================================
      // UI Controls
      // ========================================================================

      setPlayerSize: (size: UIState['playerSize']) => {
        set((draft) => {
          draft.ui.playerSize = size;
        });
      },

      setPlayerLayout: (layout: UIState['layout']) => {
        set((draft) => {
          draft.ui.layout = layout;
        });
      },

      toggleQueue: () => {
        set((draft) => {
          draft.ui.showQueue = !draft.ui.showQueue;
        });
      },

      toggleLyrics: () => {
        set((draft) => {
          draft.ui.showLyrics = !draft.ui.showLyrics;
        });
      },

      toggleEffectsPanel: () => {
        set((draft) => {
          draft.ui.showEffects = !draft.ui.showEffects;
        });
      },

      toggleAIPanel: () => {
        set((draft) => {
          draft.ui.showAI = !draft.ui.showAI;
        });
      },

      // ========================================================================
      // Social Features
      // ========================================================================

      toggleLiveChat: () => {
        set((draft) => {
          draft.social.liveChat = !draft.social.liveChat;
        });
      },

      sendChatMessage: (message: string) => {
        const chatMessage: ChatMessage = {
          id: Date.now().toString(),
          userId: 'current-user', // Would come from auth
          username: 'User', // Would come from auth
          message,
          timestamp: Date.now(),
          type: 'message',
          trackTime: get().playback.currentTime,
        };
        
        set((draft) => {
          draft.social.chatMessages.push(chatMessage);
          if (draft.social.chatMessages.length > 100) {
            draft.social.chatMessages = draft.social.chatMessages.slice(-100);
          }
        });
      },

      addReaction: (emoji: string) => {
        const reaction: ChatMessage = {
          id: Date.now().toString(),
          userId: 'current-user',
          username: 'User',
          message: emoji,
          timestamp: Date.now(),
          type: 'reaction',
          trackTime: get().playback.currentTime,
        };
        
        set((draft) => {
          draft.social.chatMessages.push(reaction);
        });
      },

      shareTrack: async (platform: string) => {
        const state = get();
        if (!state.currentTrack) return;
        
        // Implementation would depend on platform
        console.log(`Sharing track ${state.currentTrack.title} on ${platform}`);
      },

      startBroadcast: () => {
        set((draft) => {
          draft.social.broadcasting = true;
        });
      },

      stopBroadcast: () => {
        set((draft) => {
          draft.social.broadcasting = false;
        });
      },

      // ========================================================================
      // Persistence
      // ========================================================================

      saveState: async () => {
        const state = get();
        const stateToSave = {
          queue: state.queue,
          audioSettings: state.audioSettings,
          playbackModes: state.playbackModes,
          visualization: state.visualization,
          effects: state.effects,
          ai: state.ai,
          ui: state.ui,
        };
        
        try {
          localStorage.setItem('taptap-enhanced-player', JSON.stringify(stateToSave));
        } catch (error) {
          console.error('Failed to save player state:', error);
        }
      },

      loadState: async () => {
        try {
          const saved = localStorage.getItem('taptap-enhanced-player');
          if (saved) {
            const state = JSON.parse(saved);
            set((draft) => {
              Object.assign(draft.queue, state.queue || {});
              Object.assign(draft.audioSettings, state.audioSettings || {});
              Object.assign(draft.playbackModes, state.playbackModes || {});
              Object.assign(draft.visualization, state.visualization || {});
              Object.assign(draft.effects, state.effects || {});
              Object.assign(draft.ai, state.ai || {});
              Object.assign(draft.ui, state.ui || {});
            });
          }
        } catch (error) {
          console.error('Failed to load player state:', error);
        }
      },

      exportPlaylist: async (): Promise<string> => {
        const state = get();
        const playlist = {
          name: 'TapTap Playlist',
          tracks: state.queue.tracks,
          created: new Date().toISOString(),
        };
        return JSON.stringify(playlist, null, 2);
      },

      importPlaylist: async (data: string) => {
        try {
          const playlist = JSON.parse(data);
          if (playlist.tracks && Array.isArray(playlist.tracks)) {
            set((draft) => {
              draft.queue.tracks = playlist.tracks;
              draft.queue.currentIndex = 0;
            });
            get().saveState();
          }
        } catch (error) {
          console.error('Failed to import playlist:', error);
        }
      },

      // ========================================================================
      // Helper Methods
      // ========================================================================

      setupEventListeners: () => {
        const state = get();
        if (!state.audioElement) return;

        const audio = state.audioElement;

        // Time update
        const handleTimeUpdate = () => {
          set((draft) => {
            draft.playback.currentTime = audio.currentTime;
            draft.playback.duration = audio.duration || 0;
            draft.playback.buffered = audio.buffered;
          });
        };

        // Ended
        const handleEnded = () => {
          const state = get();
          if (state.playbackModes.repeat === 'one') {
            audio.currentTime = 0;
            audio.play();
          } else {
            get().skipNext();
          }
        };

        // Error
        const handleError = () => {
          set((draft) => {
            draft.playback.status = 'error';
            draft.playback.error = 'Playback error occurred';
          });
        };

        // Can play
        const handleCanPlay = () => {
          set((draft) => {
            draft.playback.canPlay = true;
            draft.playback.isLoading = false;
          });
        };

        // Waiting
        const handleWaiting = () => {
          set((draft) => {
            draft.playback.isLoading = true;
          });
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('waiting', handleWaiting);

        // Store cleanup function
        (audio as any)._cleanup = () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('waiting', handleWaiting);
        };
      },

      prepareNextTrack: () => {
        const state = get();
        if (!state.audioSettings.gaplessPlayback || !state.nextAudioElement) return;

        const nextIndex = state.queue.currentIndex + 1;
        if (nextIndex < state.queue.tracks.length) {
          const nextTrack = state.queue.tracks[nextIndex];
          state.nextAudioElement.src = nextTrack.audio_url;
          state.nextAudioElement.load();
        }
      },

      getSmartShuffleIndex: (): number => {
        const state = get();
        // AI-powered shuffle that considers listening history, preferences, and track similarity
        // This is a simplified implementation
        const availableIndices = state.queue.tracks
          .map((_, index) => index)
          .filter(index => index !== state.queue.currentIndex);
        
        return availableIndices[Math.floor(Math.random() * availableIndices.length)] || 0;
      },

    }))
  )
);

// ============================================================================
// Selectors & Hooks
// ============================================================================

export const useCurrentTrack = () => useEnhancedPlayerStore(state => state.currentTrack);
export const usePlaybackState = () => useEnhancedPlayerStore(state => state.playback);
export const useQueue = () => useEnhancedPlayerStore(state => state.queue);
export const useAudioSettings = () => useEnhancedPlayerStore(state => state.audioSettings);
export const usePlaybackModes = () => useEnhancedPlayerStore(state => state.playbackModes);
export const useVisualization = () => useEnhancedPlayerStore(state => state.visualization);
export const useEffects = () => useEnhancedPlayerStore(state => state.effects);
export const useAI = () => useEnhancedPlayerStore(state => state.ai);
export const useUI = () => useEnhancedPlayerStore(state => state.ui);
export const useSocial = () => useEnhancedPlayerStore(state => state.social);
export const useAnalytics = () => useEnhancedPlayerStore(state => state.analytics);

// Initialize store on import
if (typeof window !== 'undefined') {
  // Auto-initialize when store is first accessed
  const store = useEnhancedPlayerStore.getState();
  if (!store.isInitialized) {
    store.initialize().catch(console.error);
  }
}
