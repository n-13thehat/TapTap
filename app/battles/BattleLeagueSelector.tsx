"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, Eye, TrendingUp, Star, Crown } from "lucide-react";

interface BattleLeague {
  id: string;
  name: string;
  tier: 'MAJOR' | 'REGIONAL' | 'UNDERGROUND' | 'EMERGING';
  totalBattles: number;
  totalViews: number;
  avgViewCount: number;
  logoUrl?: string;
  isActive: boolean;
  metrics: {
    totalBattles: number;
    avgViewsPerBattle: number;
    recentActivity: number;
    lastUpdate: string | null;
  };
}

interface BattleLeagueSelectorProps {
  selectedLeagueId?: string;
  onLeagueSelect: (leagueId: string | null) => void;
}

const TIER_CONFIG = {
  MAJOR: { 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-400/10', 
    borderColor: 'border-yellow-400/30',
    icon: Crown 
  },
  REGIONAL: { 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-400/10', 
    borderColor: 'border-blue-400/30',
    icon: Trophy 
  },
  UNDERGROUND: { 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-400/10', 
    borderColor: 'border-purple-400/30',
    icon: Star 
  },
  EMERGING: { 
    color: 'text-green-400', 
    bgColor: 'bg-green-400/10', 
    borderColor: 'border-green-400/30',
    icon: TrendingUp 
  }
};

export function BattleLeagueSelector({ selectedLeagueId, onLeagueSelect }: BattleLeagueSelectorProps) {
  const [leagues, setLeagues] = useState<BattleLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/battles/leagues');
      const data = await response.json();
      setLeagues(data.leagues || []);
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const selectedLeague = leagues.find(l => l.id === selectedLeagueId);
  const majorLeagues = leagues.filter(l => l.tier === 'MAJOR');
  const otherLeagues = leagues.filter(l => l.tier !== 'MAJOR');

  if (loading) {
    return (
      <div className="bg-black/40 rounded-xl p-4 border border-teal-500/20">
        <div className="animate-pulse">
          <div className="h-6 bg-teal-500/20 rounded mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-teal-500/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 rounded-xl p-4 border border-teal-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-teal-400" />
          Battle Leagues
        </h3>
        
        <button
          onClick={() => onLeagueSelect(null)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            !selectedLeagueId 
              ? 'bg-teal-500 text-white' 
              : 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
          }`}
        >
          All Leagues
        </button>
      </div>

      {/* Selected league info */}
      {selectedLeague && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-3 bg-teal-500/10 rounded-lg border border-teal-500/20"
        >
          <div className="flex items-center gap-3">
            {selectedLeague.logoUrl && (
              <img 
                src={selectedLeague.logoUrl} 
                alt={selectedLeague.name}
                className="w-8 h-8 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <div className="text-white font-medium">{selectedLeague.name}</div>
              <div className="text-xs text-teal-300">
                {selectedLeague.metrics.totalBattles} battles • {formatNumber(selectedLeague.totalViews)} views
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs ${TIER_CONFIG[selectedLeague.tier].bgColor} ${TIER_CONFIG[selectedLeague.tier].color}`}>
              {selectedLeague.tier}
            </div>
          </div>
        </motion.div>
      )}

      {/* Major leagues */}
      <div className="space-y-2 mb-4">
        <div className="text-xs text-teal-400 font-medium">Major Leagues</div>
        {majorLeagues.map((league) => {
          const TierIcon = TIER_CONFIG[league.tier].icon;
          const isSelected = league.id === selectedLeagueId;
          
          return (
            <motion.button
              key={league.id}
              onClick={() => onLeagueSelect(league.id)}
              className={`
                w-full p-3 rounded-lg border transition-all duration-200 text-left
                ${isSelected 
                  ? 'bg-teal-500/20 border-teal-400' 
                  : 'bg-black/30 border-teal-500/20 hover:border-teal-400/40 hover:bg-black/50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                {league.logoUrl ? (
                  <img 
                    src={league.logoUrl} 
                    alt={league.name}
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <TierIcon className={`w-5 h-5 ${TIER_CONFIG[league.tier].color}`} />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {league.name}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-teal-300">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {league.metrics.totalBattles}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(league.totalViews)}
                    </span>
                  </div>
                </div>

                {/* Activity indicator */}
                {league.metrics.recentActivity > 0 && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Other leagues (collapsible) */}
      {otherLeagues.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-xs text-teal-400 font-medium mb-2 hover:text-teal-300 transition-colors"
          >
            <span>Other Leagues ({otherLeagues.length})</span>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {otherLeagues.map((league) => {
                  const TierIcon = TIER_CONFIG[league.tier].icon;
                  const isSelected = league.id === selectedLeagueId;
                  
                  return (
                    <motion.button
                      key={league.id}
                      onClick={() => onLeagueSelect(league.id)}
                      className={`
                        w-full p-2 rounded-lg border transition-all duration-200 text-left
                        ${isSelected 
                          ? 'bg-teal-500/20 border-teal-400' 
                          : 'bg-black/20 border-teal-500/10 hover:border-teal-400/30 hover:bg-black/30'
                        }
                      `}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-2">
                        <TierIcon className={`w-4 h-4 ${TIER_CONFIG[league.tier].color}`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm truncate">
                            {league.name}
                          </div>
                          <div className="text-xs text-teal-300">
                            {league.metrics.totalBattles} battles
                          </div>
                        </div>

                        <div className={`px-1.5 py-0.5 rounded text-xs ${TIER_CONFIG[league.tier].bgColor} ${TIER_CONFIG[league.tier].color}`}>
                          {league.tier}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* League stats summary */}
      <div className="mt-4 pt-4 border-t border-teal-500/20">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-white font-bold text-lg">
              {leagues.length}
            </div>
            <div className="text-xs text-teal-400">Total Leagues</div>
          </div>
          <div>
            <div className="text-white font-bold text-lg">
              {formatNumber(leagues.reduce((sum, l) => sum + l.totalViews, 0))}
            </div>
            <div className="text-xs text-teal-400">Total Views</div>
          </div>
        </div>
      </div>
    </div>
  );
}
