import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Provide a readable error when Supabase is intentionally omitted.
const missingSupabaseProxy: any = new Proxy(
  {},
  {
    get() {
      throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase-backed features.");
    },
  }
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : missingSupabaseProxy;

// Service role client for admin operations (optional)
export const supabaseAdmin =
  isSupabaseConfigured && supabaseServiceRoleKey
    ? createClient(supabaseUrl as string, supabaseServiceRoleKey as string)
    : null;

// Helper function to execute operations with service role
export const withServiceRole = async <T>(
  operation: (client: typeof supabase) => Promise<T>
): Promise<T> => {
  if (!supabaseAdmin) {
    throw new Error("Service role key not configured. Set SUPABASE_SERVICE_ROLE_KEY to enable admin Supabase operations.");
  }
  return operation(supabaseAdmin);
};

// Secure select function for multiple records
export const secureSelectMany = async <T>(
  table: string,
  columns: string = "*",
  filters?: Record<string, any>
): Promise<T[]> => {
  let query = supabase.from(table).select(columns);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch from ${table}: ${error.message}`);
  }

  return data as T[];
};

