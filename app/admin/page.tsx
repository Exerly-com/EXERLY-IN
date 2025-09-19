'use client';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ADMIN_EMAILS } from "@/lib/config";

export default function Admin() {
  const [kyc, setKyc] = useState<{ name: string }[]>([]);
  const [me, setMe] = useState<string>("");

  useEffect(() => {
    setMe(typeof window !== "undefined" ? (localStorage.getItem("adminEmail") || "") : "");
  }, []);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.storage.from("kyc").list("docs");
      setKyc((data || []).map(d => ({ name: d.name })));
    })();
  }, []);

  const isAllowed = me && ADMIN_EMAILS.includes(me.toLowerCase());

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold mb-4">Admin — KYC Approvals</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">Enter your admin email to continue.</p>
      <input
        placeholder="admin email"
        defaultValue={me}
        className="bg-white dark:bg-black border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2"
        onBlur={(e) => localStorage.setItem("adminEmail", e.target.value)}
      />
      {!isAllowed && <p className="mt-3 text-sm text-red-500">Not authorized. Set ADMIN_EMAILS in .env and enter one here.</p>}
      {isAllowed && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Pending KYC Files</h2>
          <ul className="list-disc pl-6 text-sm text-gray-600 dark:text-gray-300">
            {kyc.map((k, i) => <li key={i}>{k.name}</li>)}
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Approve/Reject actions can be implemented by updating a 'kyc_status' field in your profiles table.</p>
        </div>
      )}
    </section>
  );
}
