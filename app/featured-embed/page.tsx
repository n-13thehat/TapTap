"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Users, Music, ShoppingBag, Swords, Radio, Play, Heart, MessageCircle, Eye, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface FeaturedItem {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  stats?: any;
  href: string;
  thumbnail?: string;
}

interface FeaturedSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  items: FeaturedItem[];
  color: string;
}

export default function FeaturedEmbedPage() {
  const [sections, setSections] = useState<FeaturedSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  useEffect(() => {
    async function fetchFeaturedData() {
      try {
        setLoading(true);
        
        // Fetch data from multiple APIs in parallel
        const [homeData, socialData, trendingData, featuredData] = await Promise.all([
          fetch('/api/home/featured').then(r => r.json()).catch(() => null),
          fetch('/api/social/feed?limit=4').then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/surf/trending?region=US&max=4').then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/featured').then(r => r.json()).catch(() => null)
        ]);

        const featuredSections: FeaturedSection[] = [];

        // Trending content from surf API
        if (trendingData?.items?.length > 0) {
          featuredSections.push({
            id: 'trending',
            title: 'Trending Now',
            icon: TrendingUp,
            color: 'teal',
            items: trendingData.items.slice(0, 4).map((video: any) => ({
              id: video.id,
              title: video.title,
              subtitle: video.channel,
              type: 'video',
              stats: { views: video.stats?.views || '0' },
              href: `/surf?v=${video.id}&play=true`, // Use in-app player
              thumbnail: video.thumb,
              isYouTube: true // Flag for in-app handling
            }))
          });
        }

        // Featured tracks from library
        if (featuredData?.tracks?.length > 0) {
          featuredSections.push({
            id: 'featured-tracks',
            title: 'Featured Tracks',
            icon: Music,
            color: 'purple',
            items: featuredData.tracks.slice(0, 4).map((track: any) => ({
              id: track.id,
              title: track.title,
              subtitle: track.artist || 'Unknown Artist',
              type: 'track',
              stats: { plays: track.plays || 0 },
              href: `/track/${track.id}`
            }))
          });
        }

        // Social feed
        if (socialData?.items?.length > 0) {
          featuredSections.push({
            id: 'social',
            title: 'Latest Posts',
            icon: Users,
            color: 'blue',
            items: socialData.items.slice(0, 4).map((post: any) => ({
              id: post.id,
              title: post.text || post.content || 'New post',
              subtitle: `${post.user?.username || 'Anonymous'} • ${new Date(post.createdAt).toLocaleDateString()}`,
              type: 'post',
              stats: { 
                likes: post._count?.likes || 0, 
                comments: post._count?.comments || 0
              },
              href: `/social/post/${post.id}`
            }))
          });
        }

        // Marketplace items
        if (homeData?.marketplace?.items?.length > 0) {
          featuredSections.push({
            id: 'marketplace',
            title: 'Hot Drops',
            icon: ShoppingBag,
            color: 'amber',
            items: homeData.marketplace.items.slice(0, 4).map((product: any) => ({
              id: product.id,
              title: product.title,
              subtitle: `${product.priceCents ? `$${(product.priceCents / 100).toFixed(2)}` : 'Free'}`,
              type: 'product',
              href: `/marketplace/${product.id}`
            }))
          });
        }

        // Battles
        if (homeData?.battles?.items?.length > 0) {
          featuredSections.push({
            id: 'battles',
            title: 'Active Battles',
            icon: Swords,
            color: 'red',
            items: homeData.battles.items.slice(0, 4).map((battle: any) => ({
              id: battle.id,
              title: battle.title || 'Battle',
              subtitle: battle.status || 'Active',
              type: 'battle',
              href: `/battles/${battle.id}`
            }))
          });
        }

        // Live streams
        if (homeData?.live?.items?.length > 0) {
          featuredSections.push({
            id: 'live',
            title: 'Live Now',
            icon: Radio,
            color: 'green',
            items: homeData.live.items.slice(0, 4).map((stream: any) => ({
              id: stream.id,
              title: stream.title,
              subtitle: `Live • ${new Date(stream.startedAt).toLocaleDateString()}`,
              type: 'stream',
              href: `/live/${stream.id}`
            }))
          });
        }

        setSections(featuredSections);
        setLastUpdated(new Date());

      } catch (error) {
        console.error('Failed to fetch featured data:', error);
        setError('Failed to load featured content');
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchFeaturedData();

    // Set up real-time updates with polling every 30 seconds
    let pollInterval: NodeJS.Timeout;
    if (isRealTimeEnabled) {
      pollInterval = setInterval(() => {
        fetchFeaturedData();
      }, 30000); // 30 seconds
    }

    // Cleanup interval on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isRealTimeEnabled]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Loading featured content...</p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">Featured Content</h1>
            <p className="text-white/60">Discover the best from across TapTap Matrix</p>
          </div>

          {/* Real-time controls */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {isRealTimeEnabled ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-white/60">
                {isRealTimeEnabled ? 'Live Updates' : 'Static Mode'}
              </span>
            </div>

            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className="px-3 py-1 rounded-lg border border-white/20 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
            >
              {isRealTimeEnabled ? 'Disable' : 'Enable'} Live Updates
            </button>

            <div className="text-white/40 text-xs">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Featured Sections Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden">
                {/* Section Header */}
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${section.color}-400/10`}>
                      <Icon className={`h-4 w-4 text-${section.color}-400`} />
                    </div>
                    <h2 className="font-semibold text-white">{section.title}</h2>
                  </div>
                </div>

                {/* Section Items */}
                <div className="p-4 space-y-3">
                  {section.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_parent"
                      className="block rounded-lg border border-white/5 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex items-start gap-3">
                        {item.thumbnail && (
                          <img 
                            src={item.thumbnail} 
                            alt={item.title}
                            className="h-12 w-12 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-white text-sm line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-white/60 line-clamp-1">{item.subtitle}</p>
                          {item.stats && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                              {item.stats.views && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {item.stats.views}
                                </span>
                              )}
                              {item.stats.plays && (
                                <span className="flex items-center gap-1">
                                  <Play className="h-3 w-3" />
                                  {item.stats.plays}
                                </span>
                              )}
                              {item.stats.likes && (
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {item.stats.likes}
                                </span>
                              )}
                              {item.stats.comments && (
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {item.stats.comments}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">No featured content available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
