import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Create a server-side Supabase client with the service role key
export const createServerSupabaseClient = () => {
  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey
  );
};