"use client";

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Music, Play, MoreHorizontal, Bookmark } from 'lucide-react';

interface PostCardProps {
  post: any;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export default function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (onLike) {
      onLike(post.id);
    }
  };

  const handleComment = () => {
    setShowComments(!showComments);
    if (onComment) {
      onComment(post.id);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(post.id);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-colors">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {post.author.avatar || post.author.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-white font-medium">{post.author.username}</h4>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>{getTimeAgo(post.createdAt)}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <span>{post.location}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="text-white/60 hover:text-white transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {post.content && (
          <p className="text-white/90 mb-3">{post.content}</p>
        )}

        {/* Media Content */}
        {post.media && (
          <div className="space-y-3">
            {post.media.type === 'audio' && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <button className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors">
                    <Play size={20} />
                  </button>
                  <div className="flex-1">
                    <h5 className="text-white font-medium">{post.media.title}</h5>
                    <p className="text-white/60 text-sm">{post.media.duration}</p>
                  </div>
                  <Music size={20} className="text-purple-400" />
                </div>
                
                {/* Waveform visualization */}
                <div className="mt-3 flex items-end gap-1 h-8">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-green-500 rounded-t flex-1"
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {post.media.type === 'image' && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={post.media.url}
                  alt={post.media.alt || 'Post image'}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {post.media.type === 'video' && (
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  src={post.media.url}
                  poster={post.media.thumbnail}
                  controls
                  className="w-full h-64"
                />
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-xs hover:bg-blue-600/30 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? 'text-red-400' : 'text-white/60 hover:text-red-400'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">{post.likes + (isLiked ? 1 : 0)}</span>
          </button>

          <button
            onClick={handleComment}
            className="flex items-center gap-2 text-white/60 hover:text-blue-400 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm">{post.comments}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-white/60 hover:text-green-400 transition-colors"
          >
            <Share2 size={20} />
            <span className="text-sm">{post.shares}</span>
          </button>
        </div>

        <button
          onClick={handleBookmark}
          className={`transition-colors ${
            isBookmarked ? 'text-yellow-400' : 'text-white/60 hover:text-yellow-400'
          }`}
        >
          <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && post.recentComments && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="space-y-3">
            {post.recentComments.map((comment: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {comment.author.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{comment.author.username}</span>
                      <span className="text-white/40 text-xs">{getTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-white/80 text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                    <button className="hover:text-red-400 transition-colors">Like</button>
                    <button className="hover:text-blue-400 transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <div className="mt-4 flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              U
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Write a comment..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
