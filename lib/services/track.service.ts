import { prisma } from '@/lib/prisma';
import { 
  TrackDTO,
  PublicTrackDTO,
  TrackWithArtistDTO,
  TrackWithAlbumDTO,
  TrackWithStatsDTO,
  CreateTrackDTO,
  UpdateTrackDTO,
  toTrackDTO,
  toPublicTrackDTO,
  toTrackWithArtistDTO,
  toTrackWithAlbumDTO,
  createNotFoundError,
  createInternalError,
  createForbiddenError,
  type PaginationDTO
} from '@/lib/dto';
import type { Track, Visibility } from '@prisma/client';

export class TrackService {
  /**
   * Get track by ID (internal use)
   */
  static async getTrackById(id: string): Promise<TrackDTO | null> {
    try {
      const track = await prisma.track.findUnique({
        where: { id }
      });
      
      return track ? toTrackDTO(track) : null;
    } catch (error) {
      console.error('TrackService.getTrackById error:', error);
      throw createInternalError('Failed to fetch track');
    }
  }

  /**
   * Get public track by ID with artist info
   */
  static async getPublicTrackById(id: string): Promise<TrackWithArtistDTO | null> {
    try {
      const track = await prisma.track.findUnique({
        where: { 
          id,
          visibility: { in: ['PUBLIC', 'UNLISTED'] }
        },
        include: {
          artist: {
            include: {
              user: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        }
      });
      
      if (!track) return null;

      // Generate signed URLs for audio and cover
      const audioUrl = await this.generateAudioUrl(track.storageKey);
      const coverUrl = await this.generateCoverUrl(track.id);
      const waveformData = await this.getWaveformData(track.waveformId);
      
      return toTrackWithArtistDTO(track, audioUrl, coverUrl, waveformData);
    } catch (error) {
      console.error('TrackService.getPublicTrackById error:', error);
      throw createInternalError('Failed to fetch track');
    }
  }

  /**
   * Get track with full details including album
   */
  static async getTrackWithAlbum(id: string): Promise<TrackWithAlbumDTO | null> {
    try {
      const track = await prisma.track.findUnique({
        where: { 
          id,
          visibility: { in: ['PUBLIC', 'UNLISTED'] }
        },
        include: {
          artist: {
            include: {
              user: {
                select: {
                  avatarUrl: true
                }
              }
            }
          },
          album: true
        }
      });
      
      if (!track) return null;

      const audioUrl = await this.generateAudioUrl(track.storageKey);
      const coverUrl = await this.generateCoverUrl(track.id);
      const waveformData = await this.getWaveformData(track.waveformId);
      
      return toTrackWithAlbumDTO(track, audioUrl, coverUrl, waveformData);
    } catch (error) {
      console.error('TrackService.getTrackWithAlbum error:', error);
      throw createInternalError('Failed to fetch track with album');
    }
  }

  /**
   * Create a new track
   */
  static async createTrack(
    userId: string, 
    trackData: CreateTrackDTO
  ): Promise<TrackDTO> {
    try {
      // Verify user has artist profile
      const artist = await prisma.artist.findUnique({
        where: { userId }
      });

      if (!artist) {
        throw createForbiddenError('User must have an artist profile to create tracks');
      }

      const track = await prisma.track.create({
        data: {
          ...trackData,
          artistId: artist.id,
        }
      });
      
      return toTrackDTO(track);
    } catch (error) {
      console.error('TrackService.createTrack error:', error);
      if (error instanceof Error && error.message.includes('artist profile')) {
        throw error;
      }
      throw createInternalError('Failed to create track');
    }
  }

  /**
   * Update track
   */
  static async updateTrack(
    id: string, 
    userId: string, 
    updates: UpdateTrackDTO
  ): Promise<TrackDTO> {
    try {
      // Verify ownership
      const track = await prisma.track.findUnique({
        where: { id },
        include: {
          artist: {
            select: { userId: true }
          }
        }
      });

      if (!track) {
        throw createNotFoundError('Track', id);
      }

      if (track.artist.userId !== userId) {
        throw createForbiddenError('You can only update your own tracks');
      }

      const updatedTrack = await prisma.track.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
      
      return toTrackDTO(updatedTrack);
    } catch (error) {
      console.error('TrackService.updateTrack error:', error);
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('only update'))) {
        throw error;
      }
      throw createInternalError('Failed to update track');
    }
  }

  /**
   * Delete track
   */
  static async deleteTrack(id: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const track = await prisma.track.findUnique({
        where: { id },
        include: {
          artist: {
            select: { userId: true }
          }
        }
      });

      if (!track) {
        throw createNotFoundError('Track', id);
      }

      if (track.artist.userId !== userId) {
        throw createForbiddenError('You can only delete your own tracks');
      }

      await prisma.track.delete({
        where: { id }
      });
    } catch (error) {
      console.error('TrackService.deleteTrack error:', error);
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('only delete'))) {
        throw error;
      }
      throw createInternalError('Failed to delete track');
    }
  }

  /**
   * Get tracks by artist
   */
  static async getTracksByArtist(
    artistId: string,
    visibility: Visibility[] = ['PUBLIC'],
    limit = 20,
    offset = 0
  ): Promise<{ tracks: TrackWithArtistDTO[]; pagination: PaginationDTO }> {
    try {
      const [tracks, total] = await Promise.all([
        prisma.track.findMany({
          where: {
            artistId,
            visibility: { in: visibility }
          },
          include: {
            artist: {
              include: {
                user: {
                  select: {
                    avatarUrl: true
                  }
                }
              }
            }
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.track.count({
          where: {
            artistId,
            visibility: { in: visibility }
          }
        })
      ]);

      const tracksWithUrls = await Promise.all(
        tracks.map(async (track) => {
          const audioUrl = await this.generateAudioUrl(track.storageKey);
          const coverUrl = await this.generateCoverUrl(track.id);
          const waveformData = await this.getWaveformData(track.waveformId);
          return toTrackWithArtistDTO(track, audioUrl, coverUrl, waveformData);
        })
      );

      const pagination: PaginationDTO = {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      return { tracks: tracksWithUrls, pagination };
    } catch (error) {
      console.error('TrackService.getTracksByArtist error:', error);
      throw createInternalError('Failed to fetch tracks by artist');
    }
  }

  /**
   * Search tracks
   */
  static async searchTracks(
    query: string,
    limit = 20,
    offset = 0
  ): Promise<{ tracks: TrackWithArtistDTO[]; pagination: PaginationDTO }> {
    try {
      const [tracks, total] = await Promise.all([
        prisma.track.findMany({
          where: {
            AND: [
              {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { artist: { stageName: { contains: query, mode: 'insensitive' } } }
                ]
              },
              { visibility: 'PUBLIC' }
            ]
          },
          include: {
            artist: {
              include: {
                user: {
                  select: {
                    avatarUrl: true
                  }
                }
              }
            }
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.track.count({
          where: {
            AND: [
              {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { artist: { stageName: { contains: query, mode: 'insensitive' } } }
                ]
              },
              { visibility: 'PUBLIC' }
            ]
          }
        })
      ]);

      const tracksWithUrls = await Promise.all(
        tracks.map(async (track) => {
          const audioUrl = await this.generateAudioUrl(track.storageKey);
          const coverUrl = await this.generateCoverUrl(track.id);
          const waveformData = await this.getWaveformData(track.waveformId);
          return toTrackWithArtistDTO(track, audioUrl, coverUrl, waveformData);
        })
      );

      const pagination: PaginationDTO = {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      return { tracks: tracksWithUrls, pagination };
    } catch (error) {
      console.error('TrackService.searchTracks error:', error);
      throw createInternalError('Failed to search tracks');
    }
  }

  /**
   * Get track statistics
   */
  static async getTrackStats(id: string): Promise<{
    plays: number;
    likes: number;
    saves: number;
    comments: number;
  }> {
    try {
      const [plays, likes, saves, comments] = await Promise.all([
        prisma.playEvent.count({ where: { trackId: id } }),
        prisma.like.count({ where: { trackId: id } }),
        prisma.libraryItem.count({ where: { trackId: id } }),
        prisma.comment.count({ where: { post: { trackId: id } } })
      ]);

      return { plays, likes, saves, comments };
    } catch (error) {
      console.error('TrackService.getTrackStats error:', error);
      throw createInternalError('Failed to fetch track statistics');
    }
  }

  // Private helper methods
  private static async generateAudioUrl(storageKey: string | null): Promise<string | null> {
    if (!storageKey) return null;
    // TODO: Implement signed URL generation for audio files
    // This would typically use Supabase storage or S3 signed URLs
    return `/api/audio/${storageKey}`;
  }

  private static async generateCoverUrl(trackId: string): Promise<string | null> {
    // TODO: Implement cover image URL generation
    return `/api/covers/${trackId}`;
  }

  private static async getWaveformData(waveformId: string | null): Promise<number[] | null> {
    if (!waveformId) return null;
    
    try {
      const waveform = await prisma.waveform.findUnique({
        where: { id: waveformId },
        select: { points: true }
      });
      
      return waveform?.points as number[] || null;
    } catch (error) {
      console.warn('Failed to fetch waveform data:', error);
      return null;
    }
  }
}
