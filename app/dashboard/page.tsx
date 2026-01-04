"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Music, 
  Users, 
  ShoppingBag, 
  Swords, 
  Waves, 
  Palette,
  Library,
  Globe,
  Bot,
  Telescope,
  TrendingUp,
  Clock,
  Star,
  Play,
  Heart,
  MessageCircle,
  Share2,
  ChevronRight,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";

// Featured content types
interface FeaturedItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  type: 'track' | 'album' | 'post' | 'battle' | 'creator' | 'product';
  stats?: {
    plays?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  href: string;
}

interface DashboardSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  items: FeaturedItem[];
  viewAllHref: string;
  color: string;
}

// Real data fetching hook
function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [socialFeed, setSocialFeed] = useState<any[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [featuredContent, setFeaturedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch data from multiple APIs in parallel
        const [homeData, socialData, trendingData, featuredData] = await Promise.all([
          fetch('/api/home/featured').then(r => r.json()).catch(() => null),
          fetch('/api/social/feed?limit=6').then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/surf/trending?region=US&max=6').then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/featured').then(r => r.json()).catch(() => null)
        ]);

        setDashboardData(homeData);
        setSocialFeed(socialData.items || []);
        setTrendingVideos(trendingData.items || []);
        setFeaturedContent(featuredData);
        setLastUpdated(new Date());

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchData();

    // Set up real-time updates with polling every 60 seconds for dashboard
    let pollInterval: NodeJS.Timeout;
    if (isRealTimeEnabled) {
      pollInterval = setInterval(() => {
        fetchData();
      }, 60000); // 60 seconds for dashboard (less frequent than featured embed)
    }

    // Cleanup interval on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isRealTimeEnabled]);

  return { dashboardData, socialFeed, trendingVideos, featuredContent, loading, error, lastUpdated, isRealTimeEnabled, setIsRealTimeEnabled };
}

// Build sections from real data
function buildDashboardSections(data: {
  dashboardData: any;
  socialFeed: any[];
  trendingVideos: any[];
  featuredContent: any;
}): DashboardSection[] {
  const { dashboardData, socialFeed, trendingVideos, featuredContent } = data;
  const sections: DashboardSection[] = [];

  // Trending content from surf API
  if (trendingVideos.length > 0) {
    sections.push({
      id: 'trending',
      title: 'Trending Now',
      icon: TrendingUp,
      color: 'teal',
      viewAllHref: '/surf',
      items: trendingVideos.slice(0, 3).map((video: any) => ({
        id: video.id,
        title: video.title,
        subtitle: video.channel,
        type: 'video',
        stats: { views: video.stats?.views || '0', likes: video.stats?.likes || '0' },
        href: `/surf?v=${video.id}&play=true`, // Use in-app player
        thumbnail: video.thumb,
        isYouTube: true // Flag for in-app handling
      }))
    });
  }

  // Featured tracks from library
  if (featuredContent?.tracks?.length > 0) {
    sections.push({
      id: 'featured',
      title: 'Featured Tracks',
      icon: Music,
      color: 'teal',
      viewAllHref: '/library',
      items: featuredContent.tracks.slice(0, 3).map((track: any) => ({
        id: track.id,
        title: track.title,
        subtitle: track.artist || 'Unknown Artist',
        type: 'track',
        stats: { plays: track.plays || 0, likes: track.likes || 0 },
        href: `/track/${track.id}`
      }))
    });
  }

  // Social feed from social API
  if (socialFeed.length > 0) {
    sections.push({
      id: 'social',
      title: 'Social Feed',
      icon: Users,
      color: 'purple',
      viewAllHref: '/social',
      items: socialFeed.slice(0, 3).map((post: any) => ({
        id: post.id,
        title: post.text || post.content || 'New post',
        subtitle: `${post.user?.username || post.user?.name || 'Anonymous'} • ${new Date(post.createdAt).toLocaleDateString()}`,
        type: 'post',
        stats: {
          likes: post._count?.likes || post.likes?.length || 0,
          comments: post._count?.comments || 0,
          shares: post._count?.reposts || 0
        },
        href: `/social/post/${post.id}`
      }))
    });
  }

  // Battles from dashboard data
  if (dashboardData?.battles?.items?.length > 0) {
    sections.push({
      id: 'battles',
      title: 'Active Battles',
      icon: Swords,
      color: 'red',
      viewAllHref: '/battles',
      items: dashboardData.battles.items.slice(0, 3).map((battle: any) => ({
        id: battle.id,
        title: battle.title || 'Battle',
        subtitle: battle.status || 'Active',
        type: 'battle',
        stats: { plays: battle.plays || 0 },
        href: `/battles/${battle.id}`
      }))
    });
  }

  // Marketplace from dashboard data
  if (dashboardData?.marketplace?.items?.length > 0) {
    sections.push({
      id: 'marketplace',
      title: 'Hot Drops',
      icon: ShoppingBag,
      color: 'amber',
      viewAllHref: '/marketplace',
      items: dashboardData.marketplace.items.slice(0, 3).map((product: any) => ({
        id: product.id,
        title: product.title,
        subtitle: `${product.priceCents ? `$${(product.priceCents / 100).toFixed(2)}` : 'Free'} • ${new Date(product.createdAt).toLocaleDateString()}`,
        type: 'product',
        href: `/marketplace/${product.id}`
      }))
    });
  }

  // Live streams from dashboard data
  if (dashboardData?.live?.items?.length > 0) {
    sections.push({
      id: 'live',
      title: 'Live Now',
      icon: Radio,
      color: 'green',
      viewAllHref: '/live',
      items: dashboardData.live.items.slice(0, 3).map((stream: any) => ({
        id: stream.id,
        title: stream.title,
        subtitle: `Started ${new Date(stream.startedAt).toLocaleDateString()}`,
        type: 'stream',
        href: `/live/${stream.id}`
      }))
    });
  }

  return sections;
}

function DashboardContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { dashboardData, socialFeed, trendingVideos, featuredContent, loading: dataLoading, error, lastUpdated, isRealTimeEnabled, setIsRealTimeEnabled } = useDashboardData();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // For development/testing, show a message instead of redirecting
      console.log('User not authenticated, would redirect to /');
      // router.push('/');
      return;
    }
  }, [loading, isAuthenticated, router]);

  // Build sections from real data
  const sections = useMemo(() => {
    if (!dashboardData) return [];
    return buildDashboardSections({ dashboardData, socialFeed, trendingVideos, featuredContent });
  }, [dashboardData, socialFeed, trendingVideos, featuredContent]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="text-white/60">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-teal-500 text-black rounded-lg hover:bg-teal-400 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to TapTap Matrix</h1>
            <p className="text-white/60">Please sign in to access your dashboard</p>
          </div>
          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full px-6 py-3 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="block w-full px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-colors"
            >
              Create Account
            </a>
            <a
              href="/"
              className="block w-full px-6 py-3 text-white/60 hover:text-white transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/70 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back, {user?.username || user?.name}</h1>
              <p className="text-white/60 text-sm">Your TapTap Matrix dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Real-time status */}
              <div className="flex items-center gap-2 text-sm">
                {isRealTimeEnabled ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-white/60 hidden sm:inline">
                  {isRealTimeEnabled ? 'Live' : 'Static'}
                </span>
              </div>

              {/* Real-time toggle */}
              <button
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                className="px-3 py-1 rounded-lg border border-white/20 bg-white/5 text-white/80 hover:bg-white/10 transition-colors text-sm"
              >
                {isRealTimeEnabled ? 'Disable' : 'Enable'} Live
              </button>

              {/* User role */}
              <div className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-sm">
                {user?.role}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {dataLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded"></div>
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {sections.map(section => (
              <DashboardSection key={section.id} section={section} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function DashboardSection({ section }: { section: DashboardSection }) {
  const colorClasses = {
    teal: 'text-teal-300 border-teal-400/30 bg-teal-500/10',
    purple: 'text-purple-300 border-purple-400/30 bg-purple-500/10',
    red: 'text-red-300 border-red-400/30 bg-red-500/10',
    amber: 'text-amber-300 border-amber-400/30 bg-amber-500/10'
  };

  const colorClass = colorClasses[section.color as keyof typeof colorClasses] || colorClasses.teal;

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${colorClass}`}>
            <section.icon className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-white">{section.title}</h2>
        </div>
        <a
          href={section.viewAllHref}
          className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>

      <div className="space-y-3">
        {section.items.map(item => (
          <a
            key={item.id}
            href={item.href}
            className="block p-3 rounded-lg border border-white/10 bg-black/40 hover:bg-black/60 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate group-hover:text-teal-300 transition-colors">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-sm text-white/60 mt-1">{item.subtitle}</p>
                )}
              </div>
              {item.stats && (
                <div className="flex items-center gap-3 text-xs text-white/50 ml-3">
                  {item.stats.plays && (
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {item.stats.plays.toLocaleString()}
                    </div>
                  )}
                  {item.stats.likes && (
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {item.stats.likes}
                    </div>
                  )}
                  {item.stats.comments && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {item.stats.comments}
                    </div>
                  )}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
