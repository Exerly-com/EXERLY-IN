// lib/supabaseClient.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// ✅ Works with App Router (client components)
export const supabase = createClientComponentClient();
