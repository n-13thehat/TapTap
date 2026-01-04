'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PostsAPI } from '../supabaseClient'
import { Heart, MessageCircle, Repeat2, MoreHorizontal } from 'lucide-react'

type FeedProps = {
  onOpenProfile?: (id: string) => void
  authorId?: string
}

type Post = {
  id: string
  author?: { id: string; name: string; handle?: string; avatarUrl?: string | null }
  content: string
  mediaUrl?: string | null
  mediaType?: string | null
  likes: number
  comments: number
  reposts: number
  createdAt: string
}

export const Feed: React.FC<FeedProps> = ({ onOpenProfile, authorId }) => {
  const [posts, setPosts] = React.useState<Post[]>([])
  const [loading, setLoading] = React.useState(true)

  // Initial load
  React.useEffect(() => {
    let active = true
    const load = async () => {
      const data = await PostsAPI.list()
      if (active) setPosts(data)
      setLoading(false)
    }
    load()

    // Subscribe to new posts
    const sub = PostsAPI.subscribe((newPost) => {
      setPosts((prev) => [newPost, ...prev])
    })
    return () => {
      active = false
      sub.unsubscribe()
    }
  }, [])

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, likes: p.likes + 1 } : p
      )
    )
  }

  return (
    <div className="flex-1 min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur">
        <h2 className="text-lg font-semibold text-teal-200">Feed</h2>
      </header>

      {loading && (
        <div className="flex h-32 items-center justify-center text-gray-500">Loading postsÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</div>
      )}

      <AnimatePresence mode="popLayout">
        {posts.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-b border-white/10 bg-black/50 rounded-none px-4 py-4 hover:bg-black/40 transition-colors">
              <CardHeader className="flex flex-row items-start gap-3 p-0">
                <button
                  onClick={() => onOpenProfile && p.author && onOpenProfile(p.author.id)}
                  className="flex-shrink-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.author?.avatarUrl ?? '/placeholder/avatar.png'} />
                    <AvatarFallback>{p.author?.name?.[0] ?? '?'}</AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-200">{p.author?.name ?? 'User'}</span>
                    <span className="text-xs text-gray-500">@{p.author?.handle ?? 'handle'}</span>
                    <span className="text-xs text-gray-600">
                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-200 whitespace-pre-wrap">
                    {p.content}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-auto h-8 w-8 text-gray-400 hover:text-teal-300"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="mt-3 p-0">
                {p.mediaUrl && p.mediaType === 'image' && (
                  <img
                    src={p.mediaUrl}
                    alt="media"
                    className="mt-2 w-full rounded-xl border border-white/10 object-cover"
                  />
                )}
                {p.mediaUrl && p.mediaType === 'video' && (
                  <video
                    controls
                    src={p.mediaUrl}
                    className="mt-2 w-full rounded-xl border border-white/10"
                  />
                )}
                {p.mediaUrl && p.mediaType === 'audio' && (
                  <audio
                    controls
                    src={p.mediaUrl}
                    className="mt-2 w-full rounded-xl border border-white/10"
                  />
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-6 text-gray-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:text-teal-300"
                    onClick={() => handleLike(p.id)}
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">{p.likes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:text-teal-300"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{p.comments}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 hover:text-teal-300"
                  >
                    <Repeat2 className="h-4 w-4" />
                    <span className="text-xs">{p.reposts}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {posts.length === 0 && !loading && (
        <div className="flex h-32 items-center justify-center text-gray-500">
          No posts yet. Be the first to post!
        </div>
      )}
    </div>
  )
}


