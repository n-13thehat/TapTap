// lib/types.ts
// --------------------------------------------------------------------------------------
// Prisma-to-Supabase type bridge for TapTap Social v5K
// --------------------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          handle: string
          name: string
          bio?: string | null
          avatarUrl?: string | null
          bannerUrl?: string | null
          verified?: boolean
          createdAt: string
        }
        Insert: Omit<Database['public']['Tables']['User']['Row'], 'id' | 'createdAt'>
        Update: Partial<Database['public']['Tables']['User']['Insert']>
      }

      Post: {
        Row: {
          id: string
          authorId: string
          content: string
          mediaUrl?: string | null
          mediaType?: 'image' | 'video' | 'audio' | 'text'
          likes: number
          comments: number
          reposts: number
          createdAt: string
        }
        Insert: Omit<Database['public']['Tables']['Post']['Row'], 'id' | 'createdAt' | 'likes' | 'comments' | 'reposts'>
        Update: Partial<Database['public']['Tables']['Post']['Insert']>
      }

      Message: {
        Row: {
          id: string
          senderId: string
          recipientId: string
          body: string
          mediaUrl?: string | null
          createdAt: string
        }
        Insert: Omit<Database['public']['Tables']['Message']['Row'], 'id' | 'createdAt'>
        Update: Partial<Database['public']['Tables']['Message']['Insert']>
      }

      Notification: {
        Row: {
          id: string
          userId: string
          type: string
          data: Json
          read: boolean
          createdAt: string
        }
        Insert: Omit<Database['public']['Tables']['Notification']['Row'], 'id' | 'createdAt' | 'read'>
        Update: Partial<Database['public']['Tables']['Notification']['Insert']>
      }

      Trade: {
        Row: {
          id: string
          requesterId: string
          targetId: string
          offerTracks: Json
          askTracks: Json
          status: 'pending' | 'accepted' | 'declined'
          createdAt: string
        }
        Insert: Omit<Database['public']['Tables']['Trade']['Row'], 'id' | 'createdAt' | 'status'>
        Update: Partial<Database['public']['Tables']['Trade']['Insert']>
      }
    }
  }
}

