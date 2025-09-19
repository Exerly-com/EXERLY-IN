// /lib/getMyProfile.ts
import { supabase } from "@/lib/supabaseClient";

export async function getMyProfile() {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return null;

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id, name, company_name, is_admin, avatar_url, country")
    .eq("id", user.id)
    .single();

  if (profErr) return null;
  return profile;
}
