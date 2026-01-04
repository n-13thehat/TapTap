import { faker } from '@faker-js/faker';

function generateUsername(lowercase = false) {
  const legacy = (faker.internet as { userName?: () => string }).userName;
  const usernameFn = typeof legacy === 'function' ? legacy : faker.internet.username;
  const username = usernameFn();
  return lowercase ? username.toLowerCase() : username;
}

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  username?: string;
  role?: 'LISTENER' | 'CREATOR' | 'ADMIN' | 'MODERATOR';
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING';
  verified?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  hashedPassword?: string;
  authUserId?: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
  headerUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  deletedAt?: Date;
}

export class UserFactory {
  static create(options: UserFactoryOptions = {}) {
    const now = new Date();
    
    return {
      id: options.id || faker.string.uuid(),
      email: options.email || faker.internet.email(),
      username: options.username || generateUsername(true),
      role: options.role || 'LISTENER',
      status: options.status || 'ACTIVE',
      verified: options.verified || 'UNVERIFIED',
      hashedPassword: options.hashedPassword || faker.string.alphanumeric(60),
      authUserId: options.authUserId || faker.string.uuid(),
      avatarUrl: options.avatarUrl || faker.image.avatar(),
      bio: options.bio || faker.lorem.paragraph(),
      country: options.country || faker.location.countryCode(),
      headerUrl: options.headerUrl || faker.image.url(),
      createdAt: options.createdAt || faker.date.past(),
      updatedAt: options.updatedAt || now,
      lastLoginAt: options.lastLoginAt || faker.date.recent(),
      deletedAt: options.deletedAt || null,
    };
  }

  static createMany(count: number, options: UserFactoryOptions = {}) {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createAdmin(options: UserFactoryOptions = {}) {
    return this.create({
      ...options,
      role: 'ADMIN',
      verified: 'VERIFIED',
      status: 'ACTIVE',
    });
  }

  static createCreator(options: UserFactoryOptions = {}) {
    return this.create({
      ...options,
      role: 'CREATOR',
      verified: 'VERIFIED',
      status: 'ACTIVE',
    });
  }

  static createModerator(options: UserFactoryOptions = {}) {
    return this.create({
      ...options,
      role: 'MODERATOR',
      verified: 'VERIFIED',
      status: 'ACTIVE',
    });
  }

  static createSuspended(options: UserFactoryOptions = {}) {
    return this.create({
      ...options,
      status: 'SUSPENDED',
    });
  }

  static createDeleted(options: UserFactoryOptions = {}) {
    return this.create({
      ...options,
      status: 'DELETED',
      deletedAt: new Date(),
    });
  }

  static createUnverified(options: UserFactoryOptions = {}) {
    return this.create({
      ...options,
      verified: 'UNVERIFIED',
    });
  }

  static createWithProfile(options: UserFactoryOptions = {}) {
    const user = this.create(options);
    return {
      ...user,
      profile: {
        id: faker.string.uuid(),
        userId: user.id,
        displayName: faker.person.fullName(),
        location: faker.location.city(),
        links: {
          website: faker.internet.url(),
          twitter: `https://twitter.com/${generateUsername()}`,
          instagram: `https://instagram.com/${generateUsername()}`,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  static createWithArtist(options: UserFactoryOptions = {}) {
    const user = this.createCreator(options);
    return {
      ...user,
      artist: {
        id: faker.string.uuid(),
        userId: user.id,
        stageName: faker.person.fullName(),
        about: faker.lorem.paragraphs(2),
        links: {
          spotify: `https://open.spotify.com/artist/${faker.string.alphanumeric(22)}`,
          soundcloud: `https://soundcloud.com/${generateUsername()}`,
          bandcamp: `https://${generateUsername()}.bandcamp.com`,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  static createBatch(specifications: Array<{ count: number; options?: UserFactoryOptions }>) {
    return specifications.flatMap(spec => 
      this.createMany(spec.count, spec.options)
    );
  }

  // Create users with relationships
  static createWithFollowers(followerCount: number, options: UserFactoryOptions = {}) {
    const user = this.create(options);
    const followers = this.createMany(followerCount);
    
    return {
      ...user,
      followers: followers.map(follower => ({
        id: faker.string.uuid(),
        followerId: follower.id,
        followingId: user.id,
        createdAt: faker.date.recent(),
      })),
    };
  }

  static createWithPlaylists(playlistCount: number, options: UserFactoryOptions = {}) {
    const user = this.create(options);
    
    return {
      ...user,
      playlists: Array.from({ length: playlistCount }, () => ({
        id: faker.string.uuid(),
        userId: user.id,
        title: faker.music.songName(),
        description: faker.lorem.sentence(),
        coverUrl: faker.image.url(),
        isPublic: faker.datatype.boolean(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      })),
    };
  }

  // Realistic test scenarios
  static createNewUser() {
    return this.create({
      verified: 'UNVERIFIED',
      lastLoginAt: undefined,
      bio: undefined,
      avatarUrl: undefined,
      headerUrl: undefined,
    });
  }

  static createActiveUser() {
    return this.create({
      verified: 'VERIFIED',
      status: 'ACTIVE',
      lastLoginAt: faker.date.recent(),
    });
  }

  static createPowerUser() {
    return this.createCreator({
      verified: 'VERIFIED',
      bio: faker.lorem.paragraphs(3),
      avatarUrl: faker.image.avatar(),
      headerUrl: faker.image.url(),
      lastLoginAt: faker.date.recent(),
    });
  }
}
