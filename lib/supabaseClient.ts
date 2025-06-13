// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Remplace par tes infos depuis app.supabase.com > Project > API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
