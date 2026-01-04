/**
 * TapTap Matrix Database Configuration
 * Local-first strategy with Supabase fallback
 */

export interface DatabaseConfig {
  // Primary (Local) Database
  local: {
    url: string;
    host: string;
    port: number;
    database: string;
    user: string;
    password?: string;
  };
  
  // Fallback (Supabase) Database
  supabase: {
    url?: string;
    anonKey?: string;
    serviceRoleKey?: string;
    projectRef?: string;
  };
  
  // Connection Settings
  connection: {
    maxRetries: number;
    retryDelay: number;
    connectionTimeout: number;
    queryTimeout: number;
    poolSize: number;
  };
  
  // Feature Flags
  features: {
    enableFallback: boolean;
    enableRetries: boolean;
    enableLogging: boolean;
    enableMetrics: boolean;
  };
}

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Parse local database URL (Docker first)
  const localUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/taptap_dev';
  const localUrlParts = new URL(localUrl);
  
  return {
    local: {
      url: localUrl,
      host: localUrlParts.hostname || 'localhost',
      port: parseInt(localUrlParts.port) || 5432,
      database: localUrlParts.pathname.slice(1) || 'taptap_dev',
      user: localUrlParts.username || 'postgres',
      password: localUrlParts.password || undefined,
    },
    
    supabase: {
      url: process.env.SUPABASE_DATABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0],
    },
    
    connection: {
      maxRetries: parseInt(process.env.DATABASE_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000'),
      connectionTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '5000'),
      queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '10000'),
      poolSize: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
    },
    
    features: {
      enableFallback: process.env.DATABASE_ENABLE_FALLBACK !== 'false',
      enableRetries: process.env.DATABASE_ENABLE_RETRIES !== 'false',
      enableLogging: process.env.NODE_ENV === 'development',
      enableMetrics: process.env.DATABASE_ENABLE_METRICS === 'true',
    },
  };
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate local database configuration
  if (!config.local.url) {
    errors.push('Local database URL is required');
  }
  
  if (!config.local.host) {
    errors.push('Local database host is required');
  }
  
  if (!config.local.database) {
    errors.push('Local database name is required');
  }
  
  // Validate connection settings
  if (config.connection.maxRetries < 0) {
    errors.push('Max retries must be non-negative');
  }
  
  if (config.connection.retryDelay < 0) {
    errors.push('Retry delay must be non-negative');
  }
  
  if (config.connection.poolSize < 1) {
    errors.push('Pool size must be at least 1');
  }
  
  // Warn about missing fallback configuration
  if (config.features.enableFallback && !config.supabase.url) {
    console.warn('⚠️ Fallback enabled but Supabase URL not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get database connection string with fallback logic
 */
export function getDatabaseUrl(preferLocal = true): string {
  const config = getDatabaseConfig();
  
  if (preferLocal && config.local.url) {
    return config.local.url;
  }
  
  if (config.features.enableFallback && config.supabase.url) {
    console.log('🔄 Using Supabase fallback database');
    return config.supabase.url;
  }
  
  // Default to local even if it might not work
  return config.local.url;
}

/**
 * Check if local database is available
 */
export async function isLocalDatabaseAvailable(): Promise<boolean> {
  try {
    const config = getDatabaseConfig();
    
    // Try to connect to local database
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: config.local.url,
      connectionTimeoutMillis: config.connection.connectionTimeout,
    });
    
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    
    return true;
  } catch (error) {
    console.warn('⚠️ Local database not available:', error.message);
    return false;
  }
}

/**
 * Check if Supabase database is available
 */
export async function isSupabaseDatabaseAvailable(): Promise<boolean> {
  try {
    const config = getDatabaseConfig();
    
    if (!config.supabase.url || !config.supabase.anonKey) {
      return false;
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      config.supabase.url.replace('postgresql://', 'https://').split('@')[1].split('/')[0] + '.supabase.co',
      config.supabase.anonKey
    );
    
    // Test with a simple query
    const { error } = await supabase.from('User').select('id').limit(1);
    
    // Consider it available even if the table doesn't exist
    return !error || error.message.includes('relation') || error.message.includes('does not exist');
  } catch (error) {
    console.warn('⚠️ Supabase database not available:', error.message);
    return false;
  }
}

/**
 * Get database status information
 */
export async function getDatabaseStatus() {
  const config = getDatabaseConfig();
  const localAvailable = await isLocalDatabaseAvailable();
  const supabaseAvailable = config.features.enableFallback ? await isSupabaseDatabaseAvailable() : false;
  
  return {
    config,
    local: {
      available: localAvailable,
      url: config.local.url,
      host: config.local.host,
      port: config.local.port,
      database: config.local.database,
    },
    supabase: {
      available: supabaseAvailable,
      configured: !!(config.supabase.url && config.supabase.anonKey),
      projectRef: config.supabase.projectRef,
    },
    primary: localAvailable ? 'local' : supabaseAvailable ? 'supabase' : 'none',
    fallbackEnabled: config.features.enableFallback,
  };
}
