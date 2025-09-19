"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{ padding: 24 }}>
      <h1>Sign in</h1>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={async () => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) alert(error.message);
          else alert("Signed in! Go to dashboard.");
        }}
      >
        Sign in
      </button>

      <button
        onClick={async () => {
          const { error } = await supabase.auth.signInWithOtp({ email }); // magic link
          if (error) alert(error.message);
          else alert("Magic link sent. Check email.");
        }}
      >
        Send magic link
      </button>
    </div>
  );
}
