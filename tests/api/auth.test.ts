import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '../setup';
import { UserFactory } from '../factories/user.factory';
import { withAuth, withRole, withAdmin } from '@/lib/middleware/auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';

// Mock auth config
vi.mock('@/auth.config', () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withAuth', () => {
    it('should authenticate valid user', async () => {
      const user = UserFactory.createActiveUser();
      const mockAuth = await import('@/auth.config');
      
      // Mock session
      (mockAuth.auth as any).mockResolvedValue({
        user: { id: user.id },
      });

      // Mock database user lookup
      prismaMock.user.findUnique.mockResolvedValue(user);

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK'));
      const authenticatedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost/api/test');
      await authenticatedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: user.id,
            email: user.email,
            role: user.role,
          }),
        }),
        undefined
      );
    });

    it('should reject unauthenticated request', async () => {
      const mockAuth = await import('@/auth.config');
      (mockAuth.auth as any).mockResolvedValue(null);

      const mockHandler = vi.fn();
      const authenticatedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost/api/test');
      const response = await authenticatedHandler(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('AUTHENTICATION_ERROR');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject deleted user', async () => {
      const user = UserFactory.createDeleted();
      const mockAuth = await import('@/auth.config');
      
      (mockAuth.auth as any).mockResolvedValue({
        user: { id: user.id },
      });

      prismaMock.user.findUnique.mockResolvedValue(user);

      const mockHandler = vi.fn();
      const authenticatedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost/api/test');
      const response = await authenticatedHandler(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('AUTHENTICATION_ERROR');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject suspended user', async () => {
      const user = UserFactory.createSuspended();
      const mockAuth = await import('@/auth.config');
      
      (mockAuth.auth as any).mockResolvedValue({
        user: { id: user.id },
      });

      prismaMock.user.findUnique.mockResolvedValue(user);

      const mockHandler = vi.fn();
      const authenticatedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost/api/test');
      const response = await authenticatedHandler(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('AUTHENTICATION_ERROR');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('withRole', () => {
    it('should allow user with correct role', async () => {
      const admin = UserFactory.createAdmin();
      const mockAuth = await import('@/auth.config');
      
      (mockAuth.auth as any).mockResolvedValue({
        user: { id: admin.id },
      });

      prismaMock.user.findUnique.mockResolvedValue(admin);

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK'));
      const roleHandler = withRole('ADMIN', mockHandler);

      const request = new NextRequest('http://localhost/api/admin/test');
      await roleHandler(request);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject user with incorrect role', async () => {
      const user = UserFactory.createActiveUser(); // LISTENER role
      const mockAuth = await import('@/auth.config');
      
      (mockAuth.auth as any).mockResolvedValue({
        user: { id: user.id },
      });

      prismaMock.user.findUnique.mockResolvedValue(user);

      const mockHandler = vi.fn();
      const roleHandler = withRole('ADMIN', mockHandler);

      const request = new NextRequest('http://localhost/api/admin/test');
      const response = await roleHandler(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe('AUTHORIZATION_ERROR');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow user with any of multiple roles', async () => {
      const creator = UserFactory.createCreator();
      const mockAuth = await import('@/auth.config');
      
      (mockAuth.auth as any).mockResolvedValue({
        user: { id: creator.id },
      });

      prismaMock.user.findUnique.mockResolvedValue(creator);

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK'));
      const roleHandler = withRole(['CREATOR', 'ADMIN'], mockHandler);

      const request = new NextRequest('http://localhost/api/creator/test');
      await roleHandler(request);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('withAdmin', () => {
    it('should allow admin user', async () => {
      const admin = UserFactory.createAdmin();
      const mockAuth = await import('@/auth.config');
      
      (mockAuth.auth as any).mockResolvedValue({
        user: { id: admin.id },
      });

      prismaMock.user.findUnique.mockResolvedValue(admin);

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK'));
      const adminHandler = withAdmin(mockHandler);

      const request = new NextRequest('http://localhost/api/admin/test');
      await adminHandler(request);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject non-admin user', async () => {
      const user = UserFactory.createActiveUser();
      const mockAuth = await import('@/auth.config');
      
      (mockAuth.auth as any).mockResolvedValue({
        user: { id: user.id },
      });

      prismaMock.user.findUnique.mockResolvedValue(user);

      const mockHandler = vi.fn();
      const adminHandler = withAdmin(mockHandler);

      const request = new NextRequest('http://localhost/api/admin/test');
      const response = await adminHandler(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe('AUTHORIZATION_ERROR');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});
