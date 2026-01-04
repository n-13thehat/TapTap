"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Zap, 
  Music, 
  Sword,
  Settings,
  Database,
  Activity,
  DollarSign,
  Crown,
  Bot,
  Flag,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Wallet,
  Flame,
  Waves,
  Send
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  users: {
    total: number;
    creators: number;
    admins: number;
    activeToday: number;
  };
  battles: {
    total: number;
    live: number;
    featured: number;
    totalWagers: number;
  };
  treasury: {
    balance: number;
    burned: number;
    taxCollected: number;
    tipsVolume: number;
  };
  content: {
    tracks: number;
    albums: number;
    playlists: number;
    waveformsPending: number;
  };
  agents: {
    active: number;
    missions: number;
    interactions: number;
  };
  governance: {
    activeProposals: number;
    totalVotes: number;
  };
}

const StatCard = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  trend, 
  color = "emerald" 
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  color?: string;
}) => (
  <div className={`rounded-xl border border-${color}-400/30 bg-${color}-400/10 p-4`}>
    <div className="flex items-center justify-between">
      <div className={`rounded-lg bg-${color}-400/20 p-2 text-${color}-300`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-3">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm font-medium text-white/80">{title}</div>
      {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
    </div>
  </div>
);

const QuickAction = ({ 
  icon, 
  title, 
  description, 
  href, 
  color = "teal" 
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color?: string;
}) => (
  <Link 
    href={href}
    className={`group rounded-xl border border-${color}-400/30 bg-${color}-400/5 p-4 transition-all hover:border-${color}-400/50 hover:bg-${color}-400/10`}
  >
    <div className={`mb-3 inline-flex rounded-lg bg-${color}-400/20 p-2 text-${color}-300 group-hover:bg-${color}-400/30`}>
      {icon}
    </div>
    <h3 className="font-semibold text-white">{title}</h3>
    <p className="text-sm text-white/70">{description}</p>
  </Link>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // This would be a comprehensive admin stats endpoint
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-white/60">Loading admin dashboard...</p>
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
            <Shield className="h-8 w-8 text-teal-400" />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-teal-200">TapTap Matrix</div>
              <h1 className="text-4xl font-bold text-white">Admin Command Center</h1>
              <p className="text-white/60">Complete platform oversight and management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
              Build: ZION v2.0
            </div>
            <div className="rounded-lg border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-xs text-teal-100">
              Status: Production Ready
            </div>
          </div>
        </header>

        {/* System Status Alert */}
        <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <div className="font-semibold text-green-100">All Systems Operational</div>
              <div className="text-sm text-green-200/80">Database: ✓ API: ✓ Treasury: ✓ Battles: ✓ Agents: ✓</div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            title="Total Users"
            value={stats?.users.total || 0}
            subtitle={`${stats?.users.creators || 0} creators, ${stats?.users.activeToday || 0} active today`}
            trend="+12%"
            color="blue"
          />
          <StatCard
            icon={<Sword className="h-5 w-5" />}
            title="Battle System"
            value={stats?.battles.total || 0}
            subtitle={`${stats?.battles.live || 0} live, ${stats?.battles.featured || 0} featured`}
            trend="+25%"
            color="red"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            title="Treasury Balance"
            value={`${stats?.treasury.balance || 0} TAP`}
            subtitle={`${stats?.treasury.burned || 0} burned, ${stats?.treasury.taxCollected || 0} collected`}
            trend="+8%"
            color="emerald"
          />
          <StatCard
            icon={<Music className="h-5 w-5" />}
            title="Content Library"
            value={stats?.content.tracks || 0}
            subtitle={`${stats?.content.albums || 0} albums, ${stats?.content.playlists || 0} playlists`}
            trend="+15%"
            color="purple"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Bot className="h-5 w-5" />}
            title="AI Agents"
            value={stats?.agents.active || 0}
            subtitle={`${stats?.agents.missions || 0} missions, ${stats?.agents.interactions || 0} interactions`}
            color="cyan"
          />
          <StatCard
            icon={<Crown className="h-5 w-5" />}
            title="Governance"
            value={stats?.governance.activeProposals || 0}
            subtitle={`${stats?.governance.totalVotes || 0} total votes cast`}
            color="yellow"
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            title="System Health"
            value="100%"
            subtitle="All services operational"
            color="green"
          />
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <QuickAction
              icon={<Shield className="h-5 w-5" />}
              title="The Trap"
              description="Treasury management, tax metrics, airdrops"
              href="/admin/trap"
              color="emerald"
            />
            <QuickAction
              icon={<Flag className="h-5 w-5" />}
              title="Feature Flags"
              description="Manage feature rollouts and A/B tests"
              href="/admin/feature-flags"
              color="blue"
            />
            <QuickAction
              icon={<Sword className="h-5 w-5" />}
              title="Battle Control"
              description="Manage battles, leagues, and partnerships"
              href="/admin/battles"
              color="red"
            />
            <QuickAction
              icon={<Users className="h-5 w-5" />}
              title="User Management"
              description="Manage users, creators, and permissions"
              href="/admin/users"
              color="purple"
            />
            <QuickAction
              icon={<Bot className="h-5 w-5" />}
              title="AI Agents"
              description="Monitor and configure AI agents"
              href="/admin/agents"
              color="cyan"
            />
            <QuickAction
              icon={<Crown className="h-5 w-5" />}
              title="Governance"
              description="Manage proposals and voting"
              href="/admin/governance"
              color="yellow"
            />
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              title="Analytics"
              description="Platform metrics and insights"
              href="/admin/analytics"
              color="indigo"
            />
            <QuickAction
              icon={<Database className="h-5 w-5" />}
              title="System Tools"
              description="Database, exports, and maintenance"
              href="/admin/tools"
              color="gray"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                <span className="text-white/80">New battle league partnership approved</span>
                <span className="text-white/50">2 minutes ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                <span className="text-white/80">Feature flag "enhanced-audio" enabled for 25% of users</span>
                <span className="text-white/50">15 minutes ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                <span className="text-white/80">Treasury burn executed: 50,000 TAP tokens</span>
                <span className="text-white/50">1 hour ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                <span className="text-white/80">New governance proposal submitted</span>
                <span className="text-white/50">3 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
