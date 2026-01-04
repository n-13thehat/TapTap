'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Upload media to Supabase Storage bucket
export async function uploadMedia(file: File, folder: string) {
  const path = `${folder}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('taptap_uploads')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data: publicUrl } = supabase.storage
    .from('taptap_uploads')
    .getPublicUrl(path)
  return publicUrl.publicUrl
}

// Posts CRUD + realtime
export const PostsAPI = {
  async list() {
    const { data } = await supabase
      .from('Post')
      .select('*, author:User(id,name,handle,avatarUrl)')
      .order('createdAt', { ascending: false })
    return data ?? []
  },
  async create(payload: any) {
    const { data, error } = await supabase.from('Post').insert(payload).select().single()
    if (error) throw error
    return data
  },
  subscribe(cb: (newPost: any) => void) {
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Post' }, (payload) =>
        cb(payload.new)
      )
      .subscribe()
    return channel
  },
}

// Messages
export const MessagesAPI = {
  async list(userId: string, partnerId: string) {
    const { data } = await supabase
      .from('Message')
      .select('*')
      .or(`and(senderId.eq.${userId},recipientId.eq.${partnerId}),and(senderId.eq.${partnerId},recipientId.eq.${userId})`)
      .order('createdAt')
    return data ?? []
  },
  async send(payload: any) {
    const { data, error } = await supabase.from('Message').insert(payload).select().single()
    if (error) throw error
    return data
  },
  subscribe(cb: (msg: any) => void) {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message' }, (payload) =>
        cb(payload.new)
      )
      .subscribe()
    return channel
  },
}

// Notifications
export const NotificationsAPI = {
  async list(userId: string) {
    const { data } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
    return data ?? []
  },
  subscribe(cb: (notif: any) => void) {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Notification' }, (payload) =>
        cb(payload.new)
      )
      .subscribe()
    return channel
  },
}

// Trades
export const TradesAPI = {
  async list() {
    const { data } = await supabase
      .from('Trade')
      .select('*, requester:User(id,name,avatarUrl), target:User(id,name,avatarUrl)')
      .order('createdAt', { ascending: false })
    return data ?? []
  },
  async create(payload: any) {
    const { data, error } = await supabase.from('Trade').insert(payload).select().single()
    if (error) throw error
    return data
  },
  subscribe(cb: (trade: any) => void) {
    const channel = supabase
      .channel('trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trade' }, (payload) =>
        cb(payload.new)
      )
      .subscribe()
    return channel
  },
}
