import { prisma } from '@/lib/prisma';

export class DefaultLibraryService {
  /**
   * Add default content to a new user's library
   */
  static async addDefaultContentToUser(userId: string) {
    try {
      console.log(`📚 Adding default content to user ${userId}...`);

      // Get all default content
      const defaultContent = await prisma.defaultContent.findMany({
        orderBy: { order: 'asc' }
      });

      console.log(`Found ${defaultContent.length} default content items`);

      // Add tracks to user's library
      const trackContent = defaultContent.filter(item => item.type === 'TRACK');
      for (const item of trackContent) {
        try {
          await prisma.userLibrary.create({
            data: {
              userId: userId,
              trackId: item.contentId,
              addedAt: new Date(),
              source: 'DEFAULT'
            }
          });
          console.log(`✅ Added track ${item.title} to user library`);
        } catch (error) {
          // Skip if already exists
          if (error.code !== 'P2002') {
            console.warn(`Warning: Could not add track ${item.title}:`, error.message);
          }
        }
      }

      // Add playlists to user's library
      const playlistContent = defaultContent.filter(item => item.type === 'PLAYLIST');
      for (const item of playlistContent) {
        try {
          await prisma.userPlaylist.create({
            data: {
              userId: userId,
              playlistId: item.contentId,
              addedAt: new Date(),
              source: 'DEFAULT'
            }
          });
          console.log(`✅ Added playlist ${item.title} to user library`);
        } catch (error) {
          // Skip if already exists
          if (error.code !== 'P2002') {
            console.warn(`Warning: Could not add playlist ${item.title}:`, error.message);
          }
        }
      }

      // Create a "Welcome to TapTap Matrix" playlist for the user
      const welcomePlaylist = await prisma.playlist.create({
        data: {
          userId: userId,
          title: "Welcome to TapTap Matrix",
          description: "Your starter collection featuring Music For The Future -vx9 by VX",
          visibility: "PRIVATE",
          coverUrl: "/covers/music-for-future.jpg"
        }
      });

      // Add all default tracks to the welcome playlist
      let orderIndex = 1;
      for (const item of trackContent) {
        try {
          await prisma.playlistTrack.create({
            data: {
              playlistId: welcomePlaylist.id,
              trackId: item.contentId,
              orderIndex: orderIndex++
            }
          });
        } catch (error) {
          console.warn(`Warning: Could not add track to welcome playlist:`, error.message);
        }
      }

      console.log(`✅ Created welcome playlist with ${trackContent.length} tracks`);

      return {
        tracksAdded: trackContent.length,
        playlistsAdded: playlistContent.length,
        welcomePlaylistId: welcomePlaylist.id
      };

    } catch (error) {
      console.error('Error adding default content to user:', error);
      throw error;
    }
  }

  /**
   * Get default content for display
   */
  static async getDefaultContent() {
    try {
      const defaultContent = await prisma.defaultContent.findMany({
        orderBy: { order: 'asc' }
      });

      const tracks = [];
      const playlists = [];

      for (const item of defaultContent) {
        if (item.type === 'TRACK') {
          const track = await prisma.track.findUnique({
            where: { id: item.contentId },
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
          if (track) tracks.push(track);
        } else if (item.type === 'PLAYLIST') {
          const playlist = await prisma.playlist.findUnique({
            where: { id: item.contentId },
            include: {
              user: {
                select: {
                  username: true,
                  avatarUrl: true
                }
              },
              tracks: {
                include: {
                  track: {
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
                      }
                    }
                  }
                }
              }
            }
          });
          if (playlist) playlists.push(playlist);
        }
      }

      return { tracks, playlists };
    } catch (error) {
      console.error('Error getting default content:', error);
      return { tracks: [], playlists: [] };
    }
  }

  /**
   * Check if user has default content
   */
  static async userHasDefaultContent(userId: string): Promise<boolean> {
    try {
      const userLibraryCount = await prisma.userLibrary.count({
        where: {
          userId: userId,
          source: 'DEFAULT'
        }
      });

      return userLibraryCount > 0;
    } catch (error) {
      console.error('Error checking user default content:', error);
      return false;
    }
  }
}
