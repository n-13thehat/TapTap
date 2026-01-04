"use client";

import { useState } from 'react';
import { useBattles } from '@/hooks/useBattles';
import BattleCard from './BattleCard';
import BattleCreationWizard from './BattleCreationWizard';
import BattleDetails from './BattleDetails';
import { Battle } from '@/lib/battles/types';
import { 
  Swords, 
  Plus, 
  Filter, 
  Trophy, 
  Clock, 
  Users, 
  TrendingUp,
  Zap,
  Crown,
  Target
} from 'lucide-react';

export default function BattlesInterface() {
  const [selectedView, setSelectedView] = useState<'all' | 'active' | 'voting' | 'completed'>('active');
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { 
    isInitialized, 
    battles, 
    getBattlesByStatus,
    refreshBattles 
  } = useBattles();

  const getFilteredBattles = () => {
    switch (selectedView) {
      case 'active':
        return getBattlesByStatus('active');
      case 'voting':
        return getBattlesByStatus('voting');
      case 'completed':
        return getBattlesByStatus('completed');
      default:
        return battles;
    }
  };

  const filteredBattles = getFilteredBattles();

  const battleStats = {
    total: battles.length,
    active: getBattlesByStatus('active').length,
    voting: getBattlesByStatus('voting').length,
    completed: getBattlesByStatus('completed').length,
  };

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'all': return <Target size={16} />;
      case 'active': return <Zap size={16} />;
      case 'voting': return <Users size={16} />;
      case 'completed': return <Trophy size={16} />;
      default: return <Swords size={16} />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Swords size={48} className="mx-auto mb-4 text-white/20 animate-pulse" />
          <p className="text-white/60">Loading battles...</p>
        </div>
      </div>
    );
  }

  if (selectedBattle) {
    return (
      <BattleDetails
        battle={selectedBattle}
        onBack={() => setSelectedBattle(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords size={32} className="text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Battles</h1>
            <p className="text-white/60">
              Compete in music battles and vote for your favorites
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreationWizard(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Create Battle
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-red-600 text-white' 
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <Target size={24} className="mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold text-white">{battleStats.total}</div>
          <div className="text-sm text-white/60">Total Battles</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <Zap size={24} className="mx-auto mb-2 text-yellow-400" />
          <div className="text-2xl font-bold text-white">{battleStats.active}</div>
          <div className="text-sm text-white/60">Active</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <Users size={24} className="mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold text-white">{battleStats.voting}</div>
          <div className="text-sm text-white/60">Voting Now</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <Trophy size={24} className="mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold text-white">{battleStats.completed}</div>
          <div className="text-sm text-white/60">Completed</div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'all', name: 'All Battles', count: battleStats.total },
          { id: 'active', name: 'Active', count: battleStats.active },
          { id: 'voting', name: 'Voting Now', count: battleStats.voting },
          { id: 'completed', name: 'Completed', count: battleStats.completed },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedView === view.id
                ? 'bg-red-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {getViewIcon(view.id)}
            <span>{view.name}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {view.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="">All Types</option>
              <option value="head_to_head">Head to Head</option>
              <option value="tournament">Tournament</option>
              <option value="bracket">Bracket</option>
              <option value="community_vote">Community Vote</option>
            </select>
            
            <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="">All Genres</option>
              <option value="electronic">Electronic</option>
              <option value="hip-hop">Hip Hop</option>
              <option value="rock">Rock</option>
              <option value="pop">Pop</option>
            </select>
            
            <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            
            <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="">Sort By</option>
              <option value="created_at">Newest</option>
              <option value="total_votes">Most Votes</option>
              <option value="participants">Most Participants</option>
              <option value="ending_soon">Ending Soon</option>
            </select>
          </div>
        </div>
      )}

      {/* Battles Grid */}
      <div className="space-y-4">
        {filteredBattles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBattles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                onClick={() => setSelectedBattle(battle)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Swords size={64} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {selectedView === 'all' ? 'No battles yet' : `No ${selectedView} battles`}
            </h3>
            <p className="text-white/60 mb-4">
              {selectedView === 'all' 
                ? 'Be the first to create a battle and start the competition!'
                : `No battles in ${selectedView} status right now.`
              }
            </p>
            {selectedView === 'all' && (
              <button
                onClick={() => setShowCreationWizard(true)}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-colors"
              >
                Create Your First Battle
              </button>
            )}
          </div>
        )}
      </div>

      {/* Featured Battles */}
      {selectedView === 'all' && battles.length > 0 && (
        <div className="bg-gradient-to-r from-red-600/20 to-purple-600/20 border border-red-600/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Crown size={20} className="text-yellow-400" />
            Featured Battles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <TrendingUp size={20} className="text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Most Popular</h4>
                <p className="text-white/80 text-sm">
                  Join the battle with the most votes and engagement
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Ending Soon</h4>
                <p className="text-white/80 text-sm">
                  Don't miss your chance to vote in these closing battles
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Battle Creation Wizard Modal */}
      {showCreationWizard && (
        <BattleCreationWizard
          onClose={() => setShowCreationWizard(false)}
          onComplete={() => {
            setShowCreationWizard(false);
            refreshBattles();
          }}
        />
      )}
    </div>
  );
}
