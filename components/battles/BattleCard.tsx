"use client";

import { Battle } from '@/lib/battles/types';
import { useVoting } from '@/hooks/useBattles';
import { 
  Swords, 
  Users, 
  Clock, 
  Trophy, 
  Vote, 
  Play,
  Shield,
  Zap,
  Target,
  Crown
} from 'lucide-react';

interface BattleCardProps {
  battle: Battle;
  onClick: () => void;
}

export default function BattleCard({ battle, onClick }: BattleCardProps) {
  const { userVote, canVote } = useVoting(battle.id);

  const getStatusColor = (status: Battle['status']) => {
    switch (status) {
      case 'draft': return 'text-gray-400 bg-gray-400/20';
      case 'active': return 'text-blue-400 bg-blue-400/20';
      case 'voting': return 'text-green-400 bg-green-400/20';
      case 'completed': return 'text-purple-400 bg-purple-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getTypeIcon = (type: Battle['type']) => {
    switch (type) {
      case 'head_to_head': return <Swords size={16} />;
      case 'tournament': return <Trophy size={16} />;
      case 'bracket': return <Target size={16} />;
      case 'community_vote': return <Users size={16} />;
      case 'timed_challenge': return <Clock size={16} />;
      default: return <Swords size={16} />;
    }
  };

  const getDifficultyColor = (difficulty: Battle['difficulty_level']) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-orange-400';
      case 'expert': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTimeRemaining = () => {
    switch (battle.status) {
      case 'active':
        return formatTimeRemaining(battle.voting_starts_at);
      case 'voting':
        return formatTimeRemaining(battle.voting_ends_at);
      default:
        return null;
    }
  };

  const timeRemaining = getTimeRemaining();
  const topTracks = battle.tracks.slice(0, 2);
  const hasVoted = !!userVote;

  return (
    <div 
      onClick={onClick}
      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-6 cursor-pointer transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 text-white/60">
              {getTypeIcon(battle.type)}
              <span className="text-sm capitalize">{battle.type.replace('_', ' ')}</span>
            </div>
            
            <div className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(battle.status)}`}>
              {battle.status.charAt(0).toUpperCase() + battle.status.slice(1)}
            </div>
          </div>
          
          <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
            {battle.title}
          </h3>
          
          {battle.description && (
            <p className="text-white/60 text-sm mt-1 line-clamp-2">
              {battle.description}
            </p>
          )}
        </div>

        {battle.prize_pool && (
          <div className="ml-4 text-right">
            <Crown size={16} className="text-yellow-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-yellow-400">
              ${battle.prize_pool.total_value}
            </div>
            <div className="text-xs text-white/60">Prize Pool</div>
          </div>
        )}
      </div>

      {/* Top Tracks Preview */}
      {topTracks.length > 0 && (
        <div className="space-y-2 mb-4">
          {topTracks.map((battleTrack, index) => (
            <div key={battleTrack.track.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center text-white font-bold text-sm">
                #{index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">
                  {battleTrack.track.title}
                </div>
                <div className="text-white/60 text-xs truncate">
                  {typeof battleTrack.track.artist === 'string'
                    ? battleTrack.track.artist
                    : battleTrack.track.artist?.stageName || 'Unknown Artist'}
                </div>
              </div>
              
              {battle.status === 'voting' || battle.status === 'completed' ? (
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {battleTrack.votes}
                  </div>
                  <div className="text-xs text-white/60">votes</div>
                </div>
              ) : (
                <Play size={16} className="text-white/40" />
              )}
            </div>
          ))}
          
          {battle.tracks.length > 2 && (
            <div className="text-center text-white/60 text-sm">
              +{battle.tracks.length - 2} more tracks
            </div>
          )}
        </div>
      )}

      {/* Battle Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{battle.tracks.length}</div>
          <div className="text-xs text-white/60">Tracks</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">{battle.total_votes}</div>
          <div className="text-xs text-white/60">Votes</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">{battle.view_count}</div>
          <div className="text-xs text-white/60">Views</div>
        </div>
      </div>

      {/* Battle Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {battle.genre && (
            <span className="text-white/60">
              {battle.genre}
            </span>
          )}
          
          <div className="flex items-center gap-1">
            <Shield size={12} className={getDifficultyColor(battle.difficulty_level)} />
            <span className={`capitalize ${getDifficultyColor(battle.difficulty_level)}`}>
              {battle.difficulty_level}
            </span>
          </div>
          
          {battle.voting_config.fraud_detection_enabled && (
            <div className="flex items-center gap-1 text-green-400">
              <Shield size={12} />
              <span className="text-xs">Protected</span>
            </div>
          )}
        </div>

        {timeRemaining && (
          <div className="flex items-center gap-1 text-orange-400">
            <Clock size={12} />
            <span className="text-xs">{timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Action Indicators */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          {hasVoted && (
            <div className="flex items-center gap-1 text-green-400">
              <Vote size={14} />
              <span className="text-xs">Voted</span>
            </div>
          )}
          
          {canVote && !hasVoted && (
            <div className="flex items-center gap-1 text-blue-400">
              <Zap size={14} />
              <span className="text-xs">Can Vote</span>
            </div>
          )}
          
          {battle.status === 'completed' && battle.winner_track_id && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy size={14} />
              <span className="text-xs">Winner Declared</span>
            </div>
          )}
        </div>

        <div className="text-xs text-white/60">
          Created {new Date(battle.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
    </div>
  );
}
