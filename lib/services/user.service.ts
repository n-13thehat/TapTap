import { prisma } from '@/lib/prisma';
import { 
  UserDTO, 
  PublicUserDTO, 
  UserWithArtistDTO, 
  UserWithProfileDTO,
  toUserDTO,
  toPublicUserDTO,
  toUserWithArtistDTO,
  toUserWithProfileDTO,
  createNotFoundError,
  createInternalError,
  type ErrorDTO
} from '@/lib/dto';
import type { User, Role, AccountStatus } from '@prisma/client';

export class UserService {
  /**
   * Get user by ID (internal use)
   */
  static async getUserById(id: string): Promise<UserDTO | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      
      return user ? toUserDTO(user) : null;
    } catch (error) {
      console.error('UserService.getUserById error:', error);
      throw createInternalError('Failed to fetch user');
    }
  }

  /**
   * Get public user by ID (safe for client-side)
   */
  static async getPublicUserById(id: string): Promise<PublicUserDTO | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { 
          id,
          status: 'ACTIVE',
          deletedAt: null
        }
      });
      
      return user ? toPublicUserDTO(user) : null;
    } catch (error) {
      console.error('UserService.getPublicUserById error:', error);
      throw createInternalError('Failed to fetch user');
    }
  }

  /**
   * Get user by email (internal use)
   */
  static async getUserByEmail(email: string): Promise<UserDTO | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      return user ? toUserDTO(user) : null;
    } catch (error) {
      console.error('UserService.getUserByEmail error:', error);
      throw createInternalError('Failed to fetch user');
    }
  }

  /**
   * Get user with artist profile
   */
  static async getUserWithArtist(id: string): Promise<UserWithArtistDTO | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { 
          id,
          status: 'ACTIVE',
          deletedAt: null
        },
        include: {
          artist: true
        }
      });
      
      return user ? toUserWithArtistDTO(user) : null;
    } catch (error) {
      console.error('UserService.getUserWithArtist error:', error);
      throw createInternalError('Failed to fetch user with artist');
    }
  }

  /**
   * Get user with profile
   */
  static async getUserWithProfile(id: string): Promise<UserWithProfileDTO | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { 
          id,
          status: 'ACTIVE',
          deletedAt: null
        },
        include: {
          profile: true
        }
      });
      
      return user ? toUserWithProfileDTO(user) : null;
    } catch (error) {
      console.error('UserService.getUserWithProfile error:', error);
      throw createInternalError('Failed to fetch user with profile');
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(
    id: string, 
    updates: Partial<Pick<User, 'username' | 'bio' | 'avatarUrl' | 'headerUrl' | 'country'>>
  ): Promise<PublicUserDTO> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
      
      return toPublicUserDTO(user);
    } catch (error) {
      console.error('UserService.updateUser error:', error);
      throw createInternalError('Failed to update user');
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(id: string, role: Role): Promise<UserDTO> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { 
          role,
          updatedAt: new Date()
        }
      });
      
      return toUserDTO(user);
    } catch (error) {
      console.error('UserService.updateUserRole error:', error);
      throw createInternalError('Failed to update user role');
    }
  }

  /**
   * Update user status (admin only)
   */
  static async updateUserStatus(id: string, status: AccountStatus): Promise<UserDTO> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date(),
          ...(status === 'DELETED' ? { deletedAt: new Date() } : {})
        }
      });
      
      return toUserDTO(user);
    } catch (error) {
      console.error('UserService.updateUserStatus error:', error);
      throw createInternalError('Failed to update user status');
    }
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { lastLoginAt: new Date() }
      });
    } catch (error) {
      console.error('UserService.updateLastLogin error:', error);
      // Don't throw here as this is not critical
    }
  }

  /**
   * Search users by username or email
   */
  static async searchUsers(
    query: string, 
    limit = 20, 
    offset = 0
  ): Promise<PublicUserDTO[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            },
            { status: 'ACTIVE' },
            { deletedAt: null }
          ]
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      });
      
      return users.map(toPublicUserDTO);
    } catch (error) {
      console.error('UserService.searchUsers error:', error);
      throw createInternalError('Failed to search users');
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(id: string): Promise<{
    tracksCount: number;
    followersCount: number;
    followingCount: number;
    likesCount: number;
  }> {
    try {
      const [tracksCount, followersCount, followingCount, likesCount] = await Promise.all([
        prisma.track.count({
          where: { 
            artist: { userId: id },
            visibility: 'PUBLIC'
          }
        }),
        prisma.follow.count({
          where: { followingId: id }
        }),
        prisma.follow.count({
          where: { followerId: id }
        }),
        prisma.like.count({
          where: { userId: id }
        })
      ]);

      return {
        tracksCount,
        followersCount,
        followingCount,
        likesCount
      };
    } catch (error) {
      console.error('UserService.getUserStats error:', error);
      throw createInternalError('Failed to fetch user statistics');
    }
  }
}
