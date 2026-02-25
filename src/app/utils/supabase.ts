import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

if (!projectId || !publicAnonKey) {
  console.error("Supabase Project ID or Anon Key is missing!");
}

const supabaseUrl = `https://${projectId}.supabase.co`;
export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
