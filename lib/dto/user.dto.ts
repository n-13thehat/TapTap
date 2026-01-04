import { z } from 'zod';
import type { User, Artist, Profile } from '@prisma/client';

// Base User DTO schema
export const UserDTOSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  role: z.enum(['LISTENER', 'CREATOR', 'ADMIN']),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED']),
  verified: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED']),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  country: z.string().nullable(),
  headerUrl: z.string().url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
});

// Public User DTO (safe for client-side)
export const PublicUserDTOSchema = UserDTOSchema.pick({
  id: true,
  username: true,
  role: true,
  verified: true,
  avatarUrl: true,
  bio: true,
  country: true,
  headerUrl: true,
  createdAt: true,
});

// User with Artist DTO
export const UserWithArtistDTOSchema = UserDTOSchema.extend({
  artist: z.object({
    id: z.string().uuid(),
    stageName: z.string(),
    about: z.string().nullable(),
    links: z.record(z.any()).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }).nullable(),
});

// User with Profile DTO
export const UserWithProfileDTOSchema = UserDTOSchema.extend({
  profile: z.object({
    id: z.string().uuid(),
    displayName: z.string().nullable(),
    location: z.string().nullable(),
    links: z.record(z.any()).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }).nullable(),
});

// Type exports
export type UserDTO = z.infer<typeof UserDTOSchema>;
export type PublicUserDTO = z.infer<typeof PublicUserDTOSchema>;
export type UserWithArtistDTO = z.infer<typeof UserWithArtistDTOSchema>;
export type UserWithProfileDTO = z.infer<typeof UserWithProfileDTOSchema>;

// Transformation functions
export function toUserDTO(user: User): UserDTO {
  return UserDTOSchema.parse(user);
}

export function toPublicUserDTO(user: User): PublicUserDTO {
  return PublicUserDTOSchema.parse(user);
}

export function toUserWithArtistDTO(user: User & { artist?: Artist | null }): UserWithArtistDTO {
  return UserWithArtistDTOSchema.parse(user);
}

export function toUserWithProfileDTO(user: User & { profile?: Profile | null }): UserWithProfileDTO {
  return UserWithProfileDTOSchema.parse(user);
}

// Validation helpers
export function validateUserDTO(data: unknown): UserDTO {
  return UserDTOSchema.parse(data);
}

export function validatePublicUserDTO(data: unknown): PublicUserDTO {
  return PublicUserDTOSchema.parse(data);
}
