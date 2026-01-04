import { createClient } from '@supabase/supabase-js';
import { env, getSecret } from '@/lib/env';

// Server-side Supabase client with service role
let _supabaseAdmin: any = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    try {
      const url = getSecret('NEXT_PUBLIC_SUPABASE_URL');
      const serviceKey = getSecret('SUPABASE_SERVICE_ROLE_KEY');

      if (!url || !serviceKey) {
        console.warn('[supabaseAdmin] Missing Supabase URL or service role key');
        return null;
      }

      _supabaseAdmin = createClient(url, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'User-Agent': 'TapTap-Matrix/1.0 (Server)'
          }
        }
      });
    } catch (error) {
      console.error('[supabaseAdmin] Failed to create admin client:', error);
      return null;
    }
  }
  return _supabaseAdmin;
}

// Legacy export for backward compatibility
export const supabaseAdmin = getSupabaseAdmin();

// Helper function for server-side operations with error handling
export async function withServiceRole<T>(operation: (client: any) => Promise<T>): Promise<T> {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase admin client not available');
  }
  return await operation(client);
}
