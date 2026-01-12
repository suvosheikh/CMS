
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Connection Configuration
 * Reverting to the previous project credentials
 */
const supabaseUrl = 'https://gebtnofuqygaomvczwve.supabase.co';
const supabaseAnonKey = 'sb_publishable_SCcbU-s46NcLhfTGzIdF5A_8oycjgMJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
