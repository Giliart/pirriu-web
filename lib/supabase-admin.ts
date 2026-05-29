import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./supabase-url";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey || serviceRoleKey === "SUA_SERVICE_ROLE_KEY") {
  console.warn("SUPABASE_SERVICE_ROLE_KEY ainda não foi configurada. Rotas de checkout/webhook podem falhar até configurar.");
}

export const supabaseAdmin = createClient(getSupabaseUrl(), serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
