"use client";

import { useState } from 'react';
import { useSocial, useOutbox } from '@/hooks/useSocial';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import OutboxStatus from './OutboxStatus';
import DraftsList from './DraftsList';
import { 
  MessageSquare, 
  Edit3, 
  Send, 
  Users, 
  TrendingUp, 
  Clock,
  Home,
  Hash,
  Bookmark,
  Settings
} from 'lucide-react';

export default function SocialInterface() {
  const [selectedView, setSelectedView] = useState<'home' | 'drafts' | 'outbox' | 'trending'>('home');
  const [showComposer, setShowComposer] = useState(false);

  const { 
    isInitialized, 
    posts, 
    drafts,
    refreshData 
  } = useSocial();

  const { status: outboxStatus, hasFailedItems } = useOutbox();

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'home': return <Home size={16} />;
      case 'drafts': return <Edit3 size={16} />;
      case 'outbox': return <Send size={16} />;
      case 'trending': return <TrendingUp size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-white/20 animate-pulse" />
          <p className="text-white/60">Loading social feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare size={32} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Social</h1>
            <p className="text-white/60">
              Connect with the TapTap community
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Edit3 size={16} />
            New Post
          </button>
          
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Outbox Status Alert */}
      {(hasFailedItems || outboxStatus.pending > 0) && (
        <OutboxStatus />
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'home', name: 'Home', count: posts.length },
          { id: 'drafts', name: 'Drafts', count: drafts.length },
          { id: 'outbox', name: 'Outbox', count: outboxStatus.total },
          { id: 'trending', name: 'Trending', count: 0 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedView === view.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {getViewIcon(view.id)}
            <span>{view.name}</span>
            {view.count > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {view.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {selectedView === 'home' && (
          <div className="space-y-4">
            {/* Quick Composer */}
            <div className="bg-white/5 rounded-lg p-4">
              <button
                onClick={() => setShowComposer(true)}
                className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 text-white/60 transition-colors"
              >
                What's on your mind?
              </button>
            </div>

            {/* Posts Feed */}
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare size={64} className="mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-white/60 mb-4">
                  Be the first to share something with the community!
                </p>
                <button
                  onClick={() => setShowComposer(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Create Your First Post
                </button>
              </div>
            )}
          </div>
        )}

        {selectedView === 'drafts' && (
          <DraftsList />
        )}

        {selectedView === 'outbox' && (
          <div className="space-y-4">
            <OutboxStatus detailed />
            
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Outbox Management</h3>
              <p className="text-white/80 text-sm mb-4">
                The outbox ensures your posts are delivered reliably, even with poor network conditions.
                Failed posts are automatically retried with exponential backoff.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{outboxStatus.pending}</div>
                  <div className="text-sm text-white/60">Pending</div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{outboxStatus.sending}</div>
                  <div className="text-sm text-white/60">Sending</div>
                </div>
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{outboxStatus.failed}</div>
                  <div className="text-sm text-white/60">Failed</div>
                </div>
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {outboxStatus.total - outboxStatus.pending - outboxStatus.sending - outboxStatus.failed}
                  </div>
                  <div className="text-sm text-white/60">Sent</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'trending' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-600/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-400" />
                Trending Now
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Popular Hashtags</h4>
                  <div className="flex flex-wrap gap-2">
                    {['#NewMusic', '#BattleRoyale', '#TapTapTrending', '#ElectronicVibes'].map((tag) => (
                      <span key={tag} className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Hot Topics</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-pink-400" />
                      <span className="text-white/80 text-sm">New Battle System Launch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-pink-400" />
                      <span className="text-white/80 text-sm">Weekly Music Discovery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-pink-400" />
                      <span className="text-white/80 text-sm">Community Playlist Collab</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center py-12">
              <TrendingUp size={64} className="mx-auto mb-4 text-white/20" />
              <h3 className="text-xl font-semibold text-white mb-2">Trending Content</h3>
              <p className="text-white/60">
                Discover what's popular in the TapTap community right now
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Post Composer Modal */}
      {showComposer && (
        <PostComposer
          onClose={() => setShowComposer(false)}
          onPublished={() => {
            setShowComposer(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
