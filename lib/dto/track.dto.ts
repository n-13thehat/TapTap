import { z } from 'zod';
import type { Track, Artist, Album } from '@prisma/client';
import { PublicUserDTOSchema } from './user.dto';

// Base Track DTO schema
export const TrackDTOSchema = z.object({
  id: z.string().uuid(),
  artistId: z.string().uuid(),
  albumId: z.string().uuid().nullable(),
  title: z.string(),
  durationMs: z.number().nullable(),
  storageKey: z.string().nullable(),
  mimeType: z.string().nullable(),
  waveformId: z.string().uuid().nullable(),
  meta: z.record(z.any()).nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Public Track DTO (safe for client-side)
export const PublicTrackDTOSchema = TrackDTOSchema.pick({
  id: true,
  title: true,
  durationMs: true,
  visibility: true,
  createdAt: true,
}).extend({
  audioUrl: z.string().url().nullable(),
  coverUrl: z.string().url().nullable(),
  waveformData: z.array(z.number()).nullable(),
});

// Track with Artist DTO
export const TrackWithArtistDTOSchema = PublicTrackDTOSchema.extend({
  artist: z.object({
    id: z.string().uuid(),
    stageName: z.string(),
    about: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
  }),
});

// Track with Album DTO
export const TrackWithAlbumDTOSchema = TrackWithArtistDTOSchema.extend({
  album: z.object({
    id: z.string().uuid(),
    title: z.string(),
    coverUrl: z.string().url().nullable(),
    releaseAt: z.date().nullable(),
  }).nullable(),
});

// Track with Stats DTO
export const TrackWithStatsDTOSchema = TrackWithArtistDTOSchema.extend({
  stats: z.object({
    plays: z.number(),
    likes: z.number(),
    saves: z.number(),
    comments: z.number(),
  }),
});

// Track Creation DTO
export const CreateTrackDTOSchema = z.object({
  title: z.string().min(1).max(200),
  albumId: z.string().uuid().optional(),
  mimeType: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('PRIVATE'),
  meta: z.record(z.any()).optional(),
});

// Track Update DTO
export const UpdateTrackDTOSchema = CreateTrackDTOSchema.partial();

// Type exports
export type TrackDTO = z.infer<typeof TrackDTOSchema>;
export type PublicTrackDTO = z.infer<typeof PublicTrackDTOSchema>;
export type TrackWithArtistDTO = z.infer<typeof TrackWithArtistDTOSchema>;
export type TrackWithAlbumDTO = z.infer<typeof TrackWithAlbumDTOSchema>;
export type TrackWithStatsDTO = z.infer<typeof TrackWithStatsDTOSchema>;
export type CreateTrackDTO = z.infer<typeof CreateTrackDTOSchema>;
export type UpdateTrackDTO = z.infer<typeof UpdateTrackDTOSchema>;

// Transformation functions
export function toTrackDTO(track: Track): TrackDTO {
  return TrackDTOSchema.parse(track);
}

export function toPublicTrackDTO(track: Track, audioUrl?: string, coverUrl?: string, waveformData?: number[]): PublicTrackDTO {
  return PublicTrackDTOSchema.parse({
    id: track.id,
    title: track.title,
    durationMs: track.durationMs,
    visibility: track.visibility,
    createdAt: track.createdAt,
    audioUrl: audioUrl || null,
    coverUrl: coverUrl || null,
    waveformData: waveformData || null,
  });
}

export function toTrackWithArtistDTO(
  track: Track & { artist: Artist },
  audioUrl?: string,
  coverUrl?: string,
  waveformData?: number[]
): TrackWithArtistDTO {
  return TrackWithArtistDTOSchema.parse({
    ...toPublicTrackDTO(track, audioUrl, coverUrl, waveformData),
    artist: {
      id: track.artist.id,
      stageName: track.artist.stageName,
      about: track.artist.about,
      avatarUrl: null, // Would need to be resolved from user or separate field
    },
  });
}

export function toTrackWithAlbumDTO(
  track: Track & { artist: Artist; album?: Album | null },
  audioUrl?: string,
  coverUrl?: string,
  waveformData?: number[]
): TrackWithAlbumDTO {
  return TrackWithAlbumDTOSchema.parse({
    ...toTrackWithArtistDTO(track, audioUrl, coverUrl, waveformData),
    album: track.album ? {
      id: track.album.id,
      title: track.album.title,
      coverUrl: track.album.coverUrl,
      releaseAt: track.album.releaseAt,
    } : null,
  });
}

// Validation helpers
export function validateCreateTrackDTO(data: unknown): CreateTrackDTO {
  return CreateTrackDTOSchema.parse(data);
}

export function validateUpdateTrackDTO(data: unknown): UpdateTrackDTO {
  return UpdateTrackDTOSchema.parse(data);
}
