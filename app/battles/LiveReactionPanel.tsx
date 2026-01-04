"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Heart, Zap, Laugh, Frown, Angry, ThumbsUp } from "lucide-react";

interface ReactionData {
  type: string;
  count: number;
  avgIntensity: number;
}

interface LiveMetrics {
  totalReactions: number;
  recentReactions: number;
  dominantReaction: string | null;
  battlerScores: Record<string, number> | null;
  activeViewers: number;
}

interface LiveReactionPanelProps {
  battleContentId: string;
  isLive?: boolean;
}

const REACTION_ICONS = {
  FIRE: { icon: Flame, color: 'text-red-500', emoji: '🔥' },
  CLAP: { icon: ThumbsUp, color: 'text-green-500', emoji: '👏' },
  MIND_BLOWN: { icon: Zap, color: 'text-purple-500', emoji: '🤯' },
  LAUGHING: { icon: Laugh, color: 'text-yellow-500', emoji: '😂' },
  CRINGE: { icon: Frown, color: 'text-orange-500', emoji: '😬' },
  SLEEPY: { icon: Angry, color: 'text-gray-500', emoji: '😴' },
  ANGRY: { icon: Angry, color: 'text-red-600', emoji: '😡' },
  LOVE: { icon: Heart, color: 'text-pink-500', emoji: '❤️' },
};

export function LiveReactionPanel({ battleContentId, isLive = false }: LiveReactionPanelProps) {
  const [reactionStats, setReactionStats] = useState<ReactionData[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCooldown, setReactionCooldown] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<Array<{
    id: string;
    type: string;
    x: number;
    y: number;
  }>>([]);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReactionData();
    
    if (isLive) {
      const interval = setInterval(fetchReactionData, 2000); // Update every 2 seconds for live
      return () => clearInterval(interval);
    }
  }, [battleContentId, isLive]);

  const fetchReactionData = async () => {
    try {
      const response = await fetch(`/api/battles/reactions?battleContentId=${battleContentId}&timeWindow=300`);
      const data = await response.json();
      
      setReactionStats(data.reactionStats || []);
      setLiveMetrics(data.liveMetrics);
    } catch (error) {
      console.error('Failed to fetch reaction data:', error);
    }
  };

  const handleReaction = async (reactionType: string, intensity: number = 1) => {
    if (reactionCooldown) return;

    setReactionCooldown(true);
    
    // Add floating reaction animation
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      const newReaction = {
        id: `${Date.now()}-${Math.random()}`,
        type: reactionType,
        x: Math.random() * rect.width,
        y: rect.height - 20
      };
      
      setFloatingReactions(prev => [...prev, newReaction]);
      
      // Remove after animation
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, 2000);
    }

    try {
      const response = await fetch('/api/battles/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'react',
          battleContentId,
          reactionType,
          intensity
        })
      });

      if (response.ok) {
        // Refresh data immediately for better UX
        setTimeout(fetchReactionData, 500);
      }
    } catch (error) {
      console.error('Failed to submit reaction:', error);
    }

    // Cooldown period
    setTimeout(() => setReactionCooldown(false), 1000);
  };

  const totalReactions = reactionStats.reduce((sum, stat) => sum + stat.count, 0);
  const dominantReaction = reactionStats.reduce((max, stat) => 
    stat.count > (max?.count || 0) ? stat : max, null
  );

  return (
    <div ref={panelRef} className="relative bg-black/40 rounded-xl p-4 border border-teal-500/20">
      {/* Floating reactions */}
      <AnimatePresence>
        {floatingReactions.map((reaction) => {
          const ReactionConfig = REACTION_ICONS[reaction.type as keyof typeof REACTION_ICONS];
          return (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ 
                opacity: 0, 
                y: -100, 
                scale: 1.5,
                x: reaction.x + (Math.random() - 0.5) * 50
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute pointer-events-none text-2xl z-50"
              style={{ left: reaction.x, bottom: reaction.y }}
            >
              {ReactionConfig?.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" />
          Live Reactions
          {isLive && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </h3>
        
        {liveMetrics && (
          <div className="text-sm text-teal-300">
            {liveMetrics.activeViewers} viewers
          </div>
        )}
      </div>

      {/* Live metrics */}
      {liveMetrics && (
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="bg-teal-500/10 rounded-lg p-3">
            <div className="text-teal-400 text-xs">Total Reactions</div>
            <div className="text-white font-bold text-lg">
              {liveMetrics.totalReactions.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-teal-500/10 rounded-lg p-3">
            <div className="text-teal-400 text-xs">Recent Activity</div>
            <div className="text-white font-bold text-lg">
              +{liveMetrics.recentReactions}
            </div>
          </div>
        </div>
      )}

      {/* Battler scores */}
      {liveMetrics?.battlerScores && (
        <div className="mb-4">
          <div className="text-xs text-teal-400 mb-2">Battler Reactions</div>
          <div className="space-y-2">
            {Object.entries(liveMetrics.battlerScores).map(([battler, score]) => (
              <div key={battler} className="flex items-center justify-between">
                <span className="text-white text-sm">{battler}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (score / Math.max(...Object.values(liveMetrics.battlerScores))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-teal-300 text-sm font-medium">{score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reaction buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {Object.entries(REACTION_ICONS).map(([type, config]) => {
          const stat = reactionStats.find(s => s.type === type);
          const Icon = config.icon;
          const isActive = selectedReaction === type;
          
          return (
            <motion.button
              key={type}
              onClick={() => handleReaction(type)}
              disabled={reactionCooldown}
              className={`
                relative p-3 rounded-lg border transition-all duration-200
                ${isActive 
                  ? 'bg-teal-500/20 border-teal-400' 
                  : 'bg-black/30 border-teal-500/20 hover:border-teal-400/40'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${config.color}`} />
              <div className="text-xs text-white font-medium">
                {stat?.count || 0}
              </div>
              
              {/* Intensity indicator */}
              {stat && stat.avgIntensity > 1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full text-black text-xs flex items-center justify-center">
                  {Math.round(stat.avgIntensity)}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Reaction stats */}
      <div className="space-y-2">
        <div className="text-xs text-teal-400 mb-2">Reaction Breakdown</div>
        {reactionStats
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map((stat) => {
            const config = REACTION_ICONS[stat.type as keyof typeof REACTION_ICONS];
            const percentage = totalReactions > 0 ? (stat.count / totalReactions) * 100 : 0;
            
            return (
              <div key={stat.type} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {config && <config.icon className={`w-4 h-4 ${config.color}`} />}
                  <span className="text-white text-sm capitalize">
                    {stat.type.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-black/40 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    ></motion.div>
                  </div>
                  <span className="text-teal-300 text-sm font-medium min-w-[2rem] text-right">
                    {stat.count}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Cooldown indicator */}
      {reactionCooldown && (
        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
          <div className="text-white text-sm">Reaction sent! 🔥</div>
        </div>
      )}
    </div>
  );
}
