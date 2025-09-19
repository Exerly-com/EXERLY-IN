"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext, useState } from "react";

type SupabaseContextType = {
  supabase: SupabaseClient;
  session: Session | null;
};

const Context = createContext<SupabaseContextType | null>(null);

export default function SupabaseProvider({
  children,
  session: initialSession,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [supabase] = useState(() => createClientComponentClient());

  return (
    <Context.Provider value={{ supabase, session: initialSession }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Supabase context missing");
  return ctx;
};
