// lib/supabaseServer.ts
// Client Supabase côté serveur avec service role key pour les opérations admin
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vérifier que les variables d'environnement sont définies
if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL est manquante dans les variables d'environnement");
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY est manquante dans les variables d'environnement. Ajoutez-la dans votre fichier .env.local"
  );
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante dans les variables d'environnement");
}

// Client avec service role key pour les opérations serveur (upload, etc.)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client public pour les opérations côté client
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
