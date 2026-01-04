import { prisma } from '@/lib/prisma';
import { Track } from '@/stores/unifiedPlayer';

export interface DatabaseTrack {
  id: string;
  title: string;
  durationMs: number | null;
  storageKey: string;
  mimeType: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  artist: {
    id: string;
    stageName: string;
    user: {
      username: string;
      avatarUrl?: string | null;
    };
  };
  album?: {
    id: string;
    title: string;
    coverUrl?: string | null;
  } | null;
}

export class MusicService {
  /**
   * Get all tracks from database
   */
  static async getAllTracks(): Promise<Track[]> {
    try {
      const dbTracks = await prisma.track.findMany({
        where: {
          visibility: 'PUBLIC'
        },
        include: {
          artist: {
            include: {
              user: {
                select: {
                  username: true,
                  avatarUrl: true
                }
              }
            }
          },
          album: {
            select: {
              id: true,
              title: true,
              coverUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return dbTracks.map(this.transformDatabaseTrack);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      return [];
    }
  }

  /**
   * Get tracks by artist
   */
  static async getTracksByArtist(artistId: string): Promise<Track[]> {
    try {
      const dbTracks = await prisma.track.findMany({
        where: {
          artistId,
          visibility: 'PUBLIC'
        },
        include: {
          artist: {
            include: {
              user: {
                select: {
                  username: true,
                  avatarUrl: true
                }
              }
            }
          },
          album: {
            select: {
              id: true,
              title: true,
              coverUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return dbTracks.map(this.transformDatabaseTrack);
    } catch (error) {
      console.error('Failed to fetch artist tracks:', error);
      return [];
    }
  }

  /**
   * Get tracks by album
   */
  static async getTracksByAlbum(albumId: string): Promise<Track[]> {
    try {
      const dbTracks = await prisma.track.findMany({
        where: {
          albumId,
          visibility: 'PUBLIC'
        },
        include: {
          artist: {
            include: {
              user: {
                select: {
                  username: true,
                  avatarUrl: true
                }
              }
            }
          },
          album: {
            select: {
              id: true,
              title: true,
              coverUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return dbTracks.map(this.transformDatabaseTrack);
    } catch (error) {
      console.error('Failed to fetch album tracks:', error);
      return [];
    }
  }

  /**
   * Get single track by ID
   */
  static async getTrackById(trackId: string): Promise<Track | null> {
    try {
      const dbTrack = await prisma.track.findUnique({
        where: { id: trackId },
        include: {
          artist: {
            include: {
              user: {
                select: {
                  username: true,
                  avatarUrl: true
                }
              }
            }
          },
          album: {
            select: {
              id: true,
              title: true,
              coverUrl: true
            }
          }
        }
      });

      return dbTrack ? this.transformDatabaseTrack(dbTrack) : null;
    } catch (error) {
      console.error('Failed to fetch track:', error);
      return null;
    }
  }

  /**
   * Transform database track to player track format
   */
  private static transformDatabaseTrack(dbTrack: DatabaseTrack): Track {
    return {
      id: dbTrack.id,
      title: dbTrack.title,
      artist: dbTrack.artist.stageName,
      album: dbTrack.album?.title,
      cover: dbTrack.album?.coverUrl || dbTrack.artist.user.avatarUrl || '/default-cover.jpg',
      audioUrl: MusicService.getAudioUrl(dbTrack.storageKey),
      duration: dbTrack.durationMs ? Math.floor(dbTrack.durationMs / 1000) : undefined,
      storageKey: dbTrack.storageKey,
      mimeType: dbTrack.mimeType
    };
  }

  /**
   * Generate audio streaming URL from storage key
   */
  static getAudioUrl(storageKey: string): string {
    // For now, use a local API endpoint for streaming
    // In production, this would be your CDN or storage service URL
    return `/api/stream/${encodeURIComponent(storageKey)}`;
  }

  /**
   * Search tracks
   */
  static async searchTracks(query: string): Promise<Track[]> {
    try {
      const dbTracks = await prisma.track.findMany({
        where: {
          AND: [
            { visibility: 'PUBLIC' },
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { artist: { stageName: { contains: query, mode: 'insensitive' } } },
                { album: { title: { contains: query, mode: 'insensitive' } } }
              ]
            }
          ]
        },
        include: {
          artist: {
            include: {
              user: {
                select: {
                  username: true,
                  avatarUrl: true
                }
              }
            }
          },
          album: {
            select: {
              id: true,
              title: true,
              coverUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      });

      return dbTracks.map(this.transformDatabaseTrack);
    } catch (error) {
      console.error('Failed to search tracks:', error);
      return [];
    }
  }
}
