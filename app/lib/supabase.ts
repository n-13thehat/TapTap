"use client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Browser client uses public envs
const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const PUBLIC_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Server client uses server envs
const SERVER_URL = process.env.SUPABASE_URL as string | undefined;
const SERVER_ANON = process.env.SUPABASE_ANON_KEY as string | undefined;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE as string | undefined;

export function createBrowserClient(): SupabaseClient {
  if (!PUBLIC_URL || !PUBLIC_ANON) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(PUBLIC_URL, PUBLIC_ANON);
}

export function createServerClient(useServiceRole = false): SupabaseClient {
  const url = SERVER_URL || PUBLIC_URL;
  const key = useServiceRole ? SERVICE_ROLE : SERVER_ANON || PUBLIC_ANON;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL and key (SERVER/ANON)");
  }
  return createClient(url, key);
}

// Back-compat default export used across the app
export const supabase = (() => {
  try {
    return createBrowserClient();
  } catch {
    // In SSR or missing public envs, fall back to server anon
    return createServerClient(false);
  }
})();

// Simple realtime helper for table-level changes
export type RowChange = { eventType: "INSERT" | "UPDATE" | "DELETE"; payload: any };
export function subscribeToTable(
  table: string,
  filter: string | null,
  cb: (change: RowChange) => void
) {
  const client = supabase;
  const channel = client
    .channel(`table:${table}:${filter ?? "*"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: filter ?? undefined },
      (payload) => {
        cb({ eventType: payload.eventType as any, payload });
      }
    )
    .subscribe();

  return () => {
    try {
      client.removeChannel(channel);
    } catch { /* ignore */ }
  };
}

// Server-only helper to run secured operations with the service role key
export async function withServiceRole<T>(fn: (client: SupabaseClient) => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") {
    throw new Error("withServiceRole can only be used on the server");
  }
  const client = createServerClient(true);
  return fn(client);
}

// Some minimal secured helpers (server only)
export async function secureUpsert(
  table: string,
  values: Record<string, any> | Record<string, any>[],
  onConflict?: string
) {
  return withServiceRole(async (c) =>
    c
      .from(table)
      .upsert(values, onConflict ? { onConflict } : undefined)
      .select()
  );
}

export async function secureDelete(table: string, match: Record<string, any>) {
  return withServiceRole(async (c) => c.from(table).delete().match(match).select());
}

// Generic server RPC helper (throws on error)
export async function serverRpc<T = any>(fn: string, args?: Record<string, any>, useServiceRole = false): Promise<T> {
  if (typeof window !== "undefined") throw new Error("serverRpc can only be called on the server");
  const client = createServerClient(useServiceRole);
  const { data, error } = await client.rpc(fn, args ?? {});
  if (error) throw new Error(error.message);
  return data as T;
}

// Generic secure selects
export async function secureSelectOne<T = any>(table: string, match: Record<string, any>): Promise<T | null> {
  const res = await withServiceRole(async (c) => c.from(table).select("*").match(match).single());
  // @ts-ignore - supabase types not wired here; tolerate any
  if (res.error) return null;
  // @ts-ignore
  return (res.data ?? null) as T | null;
}

export async function secureSelectMany<T = any>(
  table: string,
  build?: (q: ReturnType<SupabaseClient["from"]>) => any
): Promise<T[]> {
  return withServiceRole(async (c) => {
    let q: any = c.from(table).select("*");
    if (build) q = build(q) || q;
    const { data } = await q;
    return (data ?? []) as T[];
  });
}
