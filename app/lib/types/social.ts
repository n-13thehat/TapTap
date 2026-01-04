export type PostView = {
  id: string
  createdAt: string
  content: string
  author: {
    username?: string | null
    displayName?: string | null
    name?: string | null
    handle?: string | null
    avatarUrl?: string | null
    image?: string | null
  } | null
}

export type Post = {
  id: string
  author: string
  text: string
  likes: number
  replies: number
  ts: number
}

export type Thread = {
  id: string
  title: string
  messages: { from: string; text: string }[]
}
