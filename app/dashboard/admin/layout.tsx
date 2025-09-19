"use client";

import { ReactNode } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Admin check error:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(profile?.is_admin === true || profile?.is_admin === "t");
      }

      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6 text-slate-300">Loading…</div>;
  if (!isAdmin) return <div className="p-6 text-slate-300">Admins only.</div>;

  return <>{children}</>;
}
