"use client";

import { useState, useEffect } from 'react';
import { 
  Sword, 
  Users, 
  Trophy, 
  Calendar, 
  DollarSign,
  Play,
  Pause,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Crown,
  Flame,
  Star
} from 'lucide-react';

interface Battle {
  id: string;
  title: string;
  battlerA: string;
  battlerB: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  viewCount: number;
  wagerAmount: number;
  league?: {
    name: string;
    tier: string;
  };
}

interface BattleLeague {
  id: string;
  name: string;
  youtubeChannelId: string;
  tier: 'PREMIER' | 'MAJOR' | 'RISING' | 'UNDERGROUND';
  isActive: boolean;
  totalBattles: number;
  avgViewership: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    SCHEDULED: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    LIVE: 'bg-red-400/20 text-red-300 border-red-400/30',
    COMPLETED: 'bg-green-400/20 text-green-300 border-green-400/30',
    CANCELLED: 'bg-gray-400/20 text-gray-300 border-gray-400/30'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
};

const TierBadge = ({ tier }: { tier: string }) => {
  const colors = {
    PREMIER: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    MAJOR: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
    RISING: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    UNDERGROUND: 'bg-gray-400/20 text-gray-300 border-gray-400/30'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[tier as keyof typeof colors]}`}>
      {tier}
    </span>
  );
};

export default function BattleAdminPage() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [leagues, setLeagues] = useState<BattleLeague[]>([]);
  const [activeTab, setActiveTab] = useState<'battles' | 'leagues' | 'featured'>('battles');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBattleData();
  }, []);

  const fetchBattleData = async () => {
    try {
      const [battlesRes, leaguesRes] = await Promise.all([
        fetch('/api/admin/battles'),
        fetch('/api/admin/battles/leagues')
      ]);
      
      if (battlesRes.ok) {
        const battlesData = await battlesRes.json();
        setBattles(battlesData.battles || []);
      }
      
      if (leaguesRes.ok) {
        const leaguesData = await leaguesRes.json();
        setLeagues(leaguesData.leagues || []);
      }
    } catch (error) {
      console.error('Failed to fetch battle data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-white/60">Loading battle management...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sword className="h-8 w-8 text-red-400" />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-red-200">Battle System</div>
              <h1 className="text-4xl font-bold text-white">Battle Control Center</h1>
              <p className="text-white/60">Manage battles, leagues, and live events</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
              <Plus className="h-4 w-4" />
              New Battle
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-400/20">
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">
            <div className="flex items-center gap-3">
              <Sword className="h-5 w-5 text-red-300" />
              <div>
                <div className="text-2xl font-bold text-white">{battles.length}</div>
                <div className="text-sm text-red-100">Total Battles</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-green-300" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {battles.filter(b => b.status === 'LIVE').length}
                </div>
                <div className="text-sm text-green-100">Live Now</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-300" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {battles.filter(b => b.status === 'SCHEDULED').length}
                </div>
                <div className="text-sm text-blue-100">Scheduled</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-yellow-300" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {battles.reduce((sum, b) => sum + b.wagerAmount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-yellow-100">Total Wagers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-white/5 p-1">
          {['battles', 'leagues', 'featured'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-red-500 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'battles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">All Battles</h2>
              <div className="flex items-center gap-2">
                <select className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white">
                  <option value="">All Status</option>
                  <option value="LIVE">Live</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Battle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Scheduled
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Wagers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {battles.map((battle) => (
                      <tr key={battle.id} className="hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">{battle.title}</div>
                            <div className="text-sm text-white/60">
                              {battle.battlerA} vs {battle.battlerB}
                            </div>
                            {battle.league && (
                              <div className="mt-1">
                                <TierBadge tier={battle.league.tier} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={battle.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-white/70">
                          {new Date(battle.scheduledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-white/70">
                          {battle.viewCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-white/70">
                          {battle.wagerAmount.toLocaleString()} TAP
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-white/60 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-white/60 hover:text-white">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leagues' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Battle Leagues</h2>
              <button className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600">
                <Plus className="h-4 w-4" />
                Add League
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagues.map((league) => (
                <div key={league.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{league.name}</h3>
                      <TierBadge tier={league.tier} />
                    </div>
                    <div className={`h-3 w-3 rounded-full ${league.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  </div>

                  <div className="space-y-2 text-sm text-white/70">
                    <div className="flex justify-between">
                      <span>Total Battles:</span>
                      <span className="text-white">{league.totalBattles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Viewership:</span>
                      <span className="text-white">{league.avgViewership.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20">
                      Manage
                    </button>
                    <button className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'featured' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Featured Battles</h2>
              <button className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600">
                <Star className="h-4 w-4" />
                Feature Battle
              </button>
            </div>

            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-6">
              <div className="text-center">
                <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Weekly Featured Battle</h3>
                <p className="text-white/70 mb-4">
                  Set up the community voting system for this week's featured battle presentation
                </p>
                <button className="rounded-lg bg-yellow-500 px-6 py-3 font-medium text-white hover:bg-yellow-600">
                  Configure Featured Battle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
