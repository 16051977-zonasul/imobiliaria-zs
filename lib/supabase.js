import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Instância única para uso no lado do cliente
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
