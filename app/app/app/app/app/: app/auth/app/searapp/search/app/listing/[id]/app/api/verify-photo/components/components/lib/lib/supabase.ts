ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null | undefined

/** Works in both server and client components. Returns null (never throws)
 *  when env vars aren't set yet, so callers can fall back gracefully
 *  instead of the app crashing before Supabase is configured. */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  cached = (url && key) ? createClient(url, key) : null
  return cached
}

