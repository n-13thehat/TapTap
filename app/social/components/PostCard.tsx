import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export type PostView = {
  id: string
  createdAt: string
  text: string
  author: { username: string | null; avatarUrl: string | null } | null
}

export function PostCard({ post }: { post: PostView }) {
  const name = post.author?.username ?? 'unknown'
  const avatar = post.author?.avatarUrl ?? ''
  const initials = (name || 'u').slice(0,2).toUpperCase()

  return (
    <article className="border-b border-white/10">
      <Card className="bg-black/50 border-0 rounded-none">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white font-medium break-all">@{name}</span>
                <span className="text-white/50">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-white/90 mt-2 whitespace-pre-wrap break-words">{post.text}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
