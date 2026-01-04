// Track-related type definitions matching Prisma schema
export interface Track {
  id: string;
  artistId: string;
  albumId?: string | null;
  title: string;
  durationMs?: number | null;
  storageKey?: string | null;
  mimeType?: string | null;
  waveformId?: string | null;
  meta?: any; // JSON field
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional for basic track interface)
  artist?: Artist;
  album?: Album | null;
  waveform?: Waveform | null;
  stats?: TrackStat | null;
  credits?: TrackCredit[];
}

// Legacy compatibility interface
export interface LegacyTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  coverArt?: string;
  genre?: string;
  year?: number;
  bpm?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  valence?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  speechiness?: number;
  loudness?: number;
  tempo?: number;
  timeSignature?: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  isPublic?: boolean;
  playCount?: number;
  likeCount?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Supporting interfaces matching Prisma models
export interface Artist {
  id: string;
  userId: string;
  stageName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  headerUrl?: string | null;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Album {
  id: string;
  artistId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  releaseDate?: Date | null;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackStat {
  id: string;
  trackId: string;
  playCount: number;
  likeCount: number;
  repostCount: number;
  updatedAt: Date;
}

export interface TrackCredit {
  id: string;
  trackId: string;
  userId?: string | null;
  name: string;
  role: string;
  createdAt: Date;
}

export interface Waveform {
  id: string;
  data: any; // JSON field
  createdAt: Date;
}

export interface TrackWithStats extends Track {
  stats: TrackStat;
}

export interface TrackWithArtist extends Track {
  artist: Artist;
}

export interface TrackAnalytics {
  trackId: string;
  plays: number;
  uniqueListeners: number;
  averageListenDuration: number;
  skipRate: number;
  completionRate: number;
  peakListeners: number;
  geographicData: Record<string, number>;
  deviceData: Record<string, number>;
  timeData: Record<string, number>;
}

export interface TrackUpload {
  file: File;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  tags?: string[];
  isPublic?: boolean;
  coverArt?: File;
}

export interface TrackFilter {
  genre?: string;
  artist?: string;
  album?: string;
  year?: number;
  bpm?: { min: number; max: number };
  duration?: { min: number; max: number };
  energy?: { min: number; max: number };
  tags?: string[];
  isPublic?: boolean;
}

export interface TrackSort {
  field: 'title' | 'artist' | 'album' | 'duration' | 'createdAt' | 'playCount' | 'likeCount';
  direction: 'asc' | 'desc';
}

export interface TrackSearchResult {
  tracks: Track[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  track: Track;
  position: number;
  addedAt: Date;
  addedBy: string;
}

export interface QueueTrack extends Track {
  queueId: string;
  position: number;
  isPlaying?: boolean;
  isNext?: boolean;
}

// Audio processing types
export interface AudioFeatures {
  tempo: number;
  key: string;
  mode: 'major' | 'minor';
  timeSignature: number;
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  valence: number;
}

export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
  channels: number;
}

export interface TrackMetadata {
  format: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  duration: number;
  size: number;
  codec: string;
  container: string;
}

// Battle-related track types
export interface BattleTrack extends Track {
  battleId: string;
  submittedBy: string;
  submittedAt: Date;
  votes: number;
  rank?: number;
}

// Library-related track types
export interface LibraryTrack extends Track {
  addedToLibraryAt: Date;
  lastPlayedAt?: Date;
  playCount: number;
  isFavorite: boolean;
  rating?: number;
  notes?: string;
}

export type TrackStatus = 'processing' | 'ready' | 'error' | 'deleted';
export type TrackVisibility = 'public' | 'private' | 'unlisted';
export type TrackType = 'original' | 'remix' | 'cover' | 'sample';
