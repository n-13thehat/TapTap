// Database types - Re-export Prisma types for consistency
export type {
  User,
  Track,
  Artist,
  Album,
  TrackStat,
  TrackCredit,
  Waveform,
  Role,
  AccountStatus,
  VerificationStatus,
  Visibility,
  Playlist,
  PlaylistTrack,
  Like,
  Follow,
  Comment,
  Post,
  Battle,
  Vote,
  Session,
  Notification,
  Setting,
  Library,
  LibraryItem,
  Favorite,
  History,
  PlayEvent,
  Upload,
  UploadSession,
  Wallet,
  Transaction,
  TapCoinTransaction,
  TapPass,
  Profile,
  Device,
  APIKey,
  AuditLog,
  Report,
  ModerationAction,
  BetaInvite,
  CreatorRequest,
  Subscription,
  Tier,
  Trade,
  Order,
  Product,
  Cart,
  Payout,
  LiveStream,
  LiveChatMessage,
  ChatParticipant,
  Message,
  SurfSession,
  SurfAllowance,
  Treasure,
  AirdropClaim,
  BattleWager,
  BattleUnlock,
  AIDialog,
  AITask,
  AIMissionProgress,
  Embedding,
  Recommendation,
  Repost,
} from '@prisma/client';

// Additional utility types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      tracks: {
        Row: Track;
        Insert: Omit<Track, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Track, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      artists: {
        Row: Artist;
        Insert: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      // Add more table types as needed
    };
  };
};

// Import Prisma types for re-export
import type {
  User,
  Track,
  Artist,
  Album,
  TrackStat,
  TrackCredit,
  Waveform,
  Role,
  AccountStatus,
  VerificationStatus,
  Visibility,
  Playlist,
  PlaylistTrack,
  Like,
  Follow,
  Comment,
  Post,
  Battle,
  Vote,
  Session,
  Notification,
  Setting,
  Library,
  LibraryItem,
  Favorite,
  History,
  PlayEvent,
  Upload,
  UploadSession,
  Wallet,
  Transaction,
  TapCoinTransaction,
  TapPass,
  Profile,
  Device,
  APIKey,
  AuditLog,
  Report,
  ModerationAction,
  BetaInvite,
  CreatorRequest,
  Subscription,
  Tier,
  Trade,
  Order,
  Product,
  Cart,
  Payout,
  LiveStream,
  LiveChatMessage,
  ChatParticipant,
  Message,
  SurfSession,
  SurfAllowance,
  Treasure,
  AirdropClaim,
  BattleWager,
  BattleUnlock,
  AIDialog,
  AITask,
  AIMissionProgress,
  Embedding,
  Recommendation,
  Repost,
} from '@prisma/client';
