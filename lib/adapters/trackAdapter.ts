// Track adapter functions to handle interface inconsistencies
import type { Track, Artist, TrackStat } from '@prisma/client';
import type { LegacyTrack, TrackWithArtist } from '@/types/track';

/**
 * Convert Prisma Track to Legacy Track format
 */
export function trackToLegacy(track: Track & { artist?: Artist; stats?: TrackStat }): LegacyTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist?.stageName || 'Unknown Artist',
    album: track.album?.title || undefined,
    duration: track.durationMs ? Math.floor(track.durationMs / 1000) : 0,
    url: track.storageKey || '',
    coverArt: track.album?.coverUrl || undefined,
    genre: (track.meta as any)?.genre || undefined,
    year: track.album?.releaseDate ? new Date(track.album.releaseDate).getFullYear() : undefined,
    bpm: (track.meta as any)?.bpm || undefined,
    key: (track.meta as any)?.key || undefined,
    energy: (track.meta as any)?.energy || undefined,
    danceability: (track.meta as any)?.danceability || undefined,
    valence: (track.meta as any)?.valence || undefined,
    acousticness: (track.meta as any)?.acousticness || undefined,
    instrumentalness: (track.meta as any)?.instrumentalness || undefined,
    liveness: (track.meta as any)?.liveness || undefined,
    speechiness: (track.meta as any)?.speechiness || undefined,
    loudness: (track.meta as any)?.loudness || undefined,
    tempo: (track.meta as any)?.tempo || undefined,
    timeSignature: (track.meta as any)?.timeSignature || undefined,
    createdAt: track.createdAt,
    updatedAt: track.updatedAt,
    userId: track.artistId,
    isPublic: track.visibility === 'PUBLIC',
    playCount: track.stats?.playCount || 0,
    likeCount: track.stats?.likeCount || 0,
    tags: (track.meta as any)?.tags || [],
    metadata: track.meta as Record<string, any> || {},
  };
}

/**
 * Convert Legacy Track to Prisma Track format
 */
export function legacyToTrack(legacy: LegacyTrack): Partial<Track> {
  return {
    title: legacy.title,
    artistId: legacy.userId || '',
    durationMs: legacy.duration * 1000,
    storageKey: legacy.url,
    visibility: legacy.isPublic ? 'PUBLIC' : 'PRIVATE',
    meta: {
      genre: legacy.genre,
      bpm: legacy.bpm,
      key: legacy.key,
      energy: legacy.energy,
      danceability: legacy.danceability,
      valence: legacy.valence,
      acousticness: legacy.acousticness,
      instrumentalness: legacy.instrumentalness,
      liveness: legacy.liveness,
      speechiness: legacy.speechiness,
      loudness: legacy.loudness,
      tempo: legacy.tempo,
      timeSignature: legacy.timeSignature,
      tags: legacy.tags,
      ...legacy.metadata,
    },
  };
}

/**
 * Convert Prisma Track with Artist to TrackWithArtist format
 */
export function trackWithArtistAdapter(track: Track & { artist: Artist }): TrackWithArtist {
  return {
    ...track,
    artist: {
      id: track.artist.id,
      userId: track.artist.userId,
      stageName: track.artist.stageName,
      bio: track.artist.bio,
      avatarUrl: track.artist.avatarUrl,
      headerUrl: track.artist.headerUrl,
      verified: track.artist.verified,
      createdAt: track.artist.createdAt,
      updatedAt: track.artist.updatedAt,
    },
  };
}

/**
 * Normalize track data for consistent usage across components
 */
export function normalizeTrack(track: any): TrackWithArtist {
  // Handle different track formats
  if (track.artist && typeof track.artist === 'object') {
    // Already in correct format
    return track as TrackWithArtist;
  }
  
  if (track.artist && typeof track.artist === 'string') {
    // Legacy format with artist as string
    return {
      ...track,
      artist: {
        id: track.artistId || track.userId || '',
        userId: track.artistId || track.userId || '',
        stageName: track.artist,
        bio: null,
        avatarUrl: null,
        headerUrl: null,
        verified: false,
        createdAt: track.createdAt || new Date(),
        updatedAt: track.updatedAt || new Date(),
      },
    };
  }
  
  // Fallback
  return {
    ...track,
    artist: {
      id: track.artistId || '',
      userId: track.artistId || '',
      stageName: 'Unknown Artist',
      bio: null,
      avatarUrl: null,
      headerUrl: null,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

/**
 * Get track URL for playback
 */
export function getTrackUrl(track: Track | LegacyTrack): string {
  if ('storageKey' in track) {
    return track.storageKey || '';
  }
  if ('url' in track) {
    return track.url || '';
  }
  return '';
}

/**
 * Get track duration in seconds
 */
export function getTrackDuration(track: Track | LegacyTrack): number {
  if ('durationMs' in track) {
    return track.durationMs ? Math.floor(track.durationMs / 1000) : 0;
  }
  if ('duration' in track) {
    return track.duration || 0;
  }
  return 0;
}

/**
 * Get track cover art URL
 */
export function getTrackCoverArt(track: any): string | undefined {
  if (track.album?.coverUrl) {
    return track.album.coverUrl;
  }
  if (track.coverArt) {
    return track.coverArt;
  }
  if (track.artist?.avatarUrl) {
    return track.artist.avatarUrl;
  }
  return undefined;
}
