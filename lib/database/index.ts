/**
 * TapTap Matrix Database Service
 * Local-first strategy with Supabase fallback
 */

import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database connection status
export type DatabaseStatus = 'local' | 'supabase' | 'offline';

interface DatabaseConfig {
  localUrl: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  maxRetries: number;
  retryDelay: number;
}

class DatabaseService {
  private prisma: PrismaClient | null = null;
  private supabase: SupabaseClient | null = null;
  private status: DatabaseStatus = 'offline';
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      localUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/taptap_dev',
      supabaseUrl: process.env.SUPABASE_DATABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      maxRetries: 3,
      retryDelay: 1000
    };

    this.initialize();
  }

  private async initialize() {
    console.log('🔗 Initializing TapTap Matrix Database Service...');
    
    // Try local database first
    if (await this.connectLocal()) {
      this.status = 'local';
      console.log('✅ Connected to local PostgreSQL database');
      return;
    }

    // Fallback to Supabase
    if (await this.connectSupabase()) {
      this.status = 'supabase';
      console.log('✅ Connected to Supabase database (fallback)');
      return;
    }

    console.warn('⚠️ No database connection available - running in offline mode');
    this.status = 'offline';
  }

  private async connectLocal(): Promise<boolean> {
    try {
      console.log('🔗 Attempting local PostgreSQL connection...');
      
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: this.config.localUrl
          }
        },
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
      });

      // Test connection
      await this.prisma.$connect();
      await this.prisma.$queryRaw`SELECT 1`;
      
      console.log('✅ Local PostgreSQL connection successful');
      return true;
    } catch (error) {
      console.warn('⚠️ Local PostgreSQL connection failed:', error.message);
      if (this.prisma) {
        await this.prisma.$disconnect();
        this.prisma = null;
      }
      return false;
    }
  }

  private async connectSupabase(): Promise<boolean> {
    try {
      if (!this.config.supabaseUrl || !this.config.supabaseKey) {
        console.warn('⚠️ Supabase credentials not available');
        return false;
      }

      console.log('🔗 Attempting Supabase connection...');
      
      // Create Supabase client
      this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      
      // Test connection with a simple query
      const { error } = await this.supabase.from('User').select('id').limit(1);
      
      if (error && !error.message.includes('relation "User" does not exist')) {
        throw error;
      }

      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.warn('⚠️ Supabase connection failed:', error.message);
      this.supabase = null;
      return false;
    }
  }

  // Get the appropriate database client
  public getClient(): { prisma: PrismaClient | null; supabase: SupabaseClient | null; status: DatabaseStatus } {
    return {
      prisma: this.prisma,
      supabase: this.supabase,
      status: this.status
    };
  }

  // Get Prisma client (local-first)
  public getPrisma(): PrismaClient | null {
    if (this.status === 'local' && this.prisma) {
      return this.prisma;
    }
    
    console.warn('⚠️ Prisma client not available, status:', this.status);
    return null;
  }

  // Get Supabase client (fallback)
  public getSupabase(): SupabaseClient | null {
    return this.supabase;
  }

  // Get current database status
  public getStatus(): DatabaseStatus {
    return this.status;
  }

  // Reconnect with retry logic
  public async reconnect(): Promise<boolean> {
    console.log('🔄 Attempting database reconnection...');
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      console.log(`🔄 Reconnection attempt ${attempt}/${this.config.maxRetries}`);
      
      // Try local first
      if (await this.connectLocal()) {
        this.status = 'local';
        console.log('✅ Reconnected to local database');
        return true;
      }

      // Try Supabase fallback
      if (await this.connectSupabase()) {
        this.status = 'supabase';
        console.log('✅ Reconnected to Supabase database');
        return true;
      }

      if (attempt < this.config.maxRetries) {
        console.log(`⏳ Waiting ${this.config.retryDelay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    console.error('❌ All reconnection attempts failed');
    this.status = 'offline';
    return false;
  }

  // Cleanup connections
  public async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
    this.supabase = null;
    this.status = 'offline';
    console.log('🔌 Database connections closed');
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

// Export the service and convenience methods
export { databaseService };
export const prisma = databaseService.getPrisma();
export const supabase = databaseService.getSupabase();
export const getDatabaseStatus = () => databaseService.getStatus();
