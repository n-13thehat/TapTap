export type PostView = {
  id: string
  createdAt: string
  text: string
  author: { username: string | null; avatarUrl: string | null } | null
}
export type BootstrapPayload = {
  posts: PostView[]
  currentUser?: { id: string; username: string | null; avatarUrl: string | null } | null
}
