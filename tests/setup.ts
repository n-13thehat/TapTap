import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { expect } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock Prisma client
export const prismaMock = mockDeep<PrismaClient>();

// Mock Next.js app for integration tests
let app: any;
let server: any;
let handle: any;

// Test database setup
export async function setupTestDatabase() {
  // In a real setup, you'd create a test database
  // For now, we'll use mocks
  console.log('Setting up test database...');
}

export async function teardownTestDatabase() {
  console.log('Tearing down test database...');
}

// Setup test server
export async function setupTestServer() {
  const dev = process.env.NODE_ENV !== 'production';
  app = next({ dev, dir: process.cwd() });
  handle = app.getRequestHandler();

  await app.prepare();

  server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  return new Promise<void>((resolve) => {
    server.listen(0, () => {
      const port = server.address()?.port;
      process.env.TEST_SERVER_URL = `http://localhost:${port}`;
      console.log(`Test server running on port ${port}`);
      resolve();
    });
  });
}

export async function teardownTestServer() {
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('Test server closed');
        resolve();
      });
    });
  }
}

// Global test setup
beforeAll(async () => {
  await setupTestDatabase();
  // Uncomment for integration tests
  // await setupTestServer();
});

afterAll(async () => {
  await teardownTestDatabase();
  // Uncomment for integration tests
  // await teardownTestServer();
});

beforeEach(() => {
  mockReset(prismaMock);
});

afterEach(() => {
  // Clean up any test data
  cleanup();
});

// Test utilities
export const testConfig = {
  timeout: 10000,
  retries: 2,
};

// Mock data generators
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    role: 'LISTENER',
    status: 'ACTIVE',
    verified: 'VERIFIED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockTrack(overrides: Partial<any> = {}) {
  return {
    id: 'test-track-id',
    title: 'Test Track',
    artistId: 'test-artist-id',
    audioUrl: 'https://example.com/track.mp3',
    durationMs: 180000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockAlbum(overrides: Partial<any> = {}) {
  return {
    id: 'test-album-id',
    title: 'Test Album',
    artistId: 'test-artist-id',
    coverUrl: 'https://example.com/cover.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockPlaylist(overrides: Partial<any> = {}) {
  return {
    id: 'test-playlist-id',
    title: 'Test Playlist',
    userId: 'test-user-id',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// API test helpers
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
  user = createMockUser()
) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer mock-token-${user.id}`,
    ...options.headers,
  };

  return fetch(`${process.env.TEST_SERVER_URL}${url}`, {
    ...options,
    headers,
  });
}

export async function makeRequest(url: string, options: RequestInit = {}) {
  return fetch(`${process.env.TEST_SERVER_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}

// Database test helpers
export function mockPrismaTransaction(operations: any[]) {
  prismaMock.$transaction.mockImplementation(async (callback) => {
    return callback(prismaMock);
  });
  
  return operations;
}

// Performance test helpers
export function measurePerformance<T>(
  operation: () => Promise<T>,
  name: string
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve) => {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    resolve({ result, duration });
  });
}

// Error test helpers
export function expectError(
  operation: () => Promise<any>,
  expectedError: string | RegExp
) {
  return expect(operation()).rejects.toThrow(expectedError);
}

// Mock external services
export const mockExternalServices = {
  supabase: {
    auth: {
      getUser: vi.fn(),
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
      })),
    },
  },
  
  solana: {
    connection: {
      getBalance: vi.fn(),
      sendTransaction: vi.fn(),
    },
  },
  
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
};

// Test data cleanup
export async function cleanupTestData() {
  // In a real setup, you'd clean up test data from the database
  console.log('Cleaning up test data...');
}
