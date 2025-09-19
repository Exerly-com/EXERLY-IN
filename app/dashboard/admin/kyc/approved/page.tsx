"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast-provider";

type Row = {
  id: string; // row id of kyc_submissions
  user_id: string;
  name: string;
  aadhaar_number: string | null;
  pan_number: string | null;
  status: string;
  flags: any;
  ai_extracted: any;
  doc_aadhaar_front: string | null;
  doc_aadhaar_back: string | null;
  doc_pan: string | null;
  doc_iec: string | null;
  doc_gstin: string | null;
};

export default function KycAdminApproved() {
  const [rows, setRows] = useState<Row[]>([]);
  const [meAdmin, setMeAdmin] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ FIXED: check in profiles.is_admin instead of admin_users
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profErr) {
        console.error("Failed to fetch profile:", profErr);
        return;
      }

      const isAdmin = profile?.is_admin === true || profile?.is_admin === "t";
      setMeAdmin(isAdmin);

      if (!isAdmin) return;

      // ✅ fetch approved KYC submissions
      const { data } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      setRows(data || []);
    })();
  }, []);

  async function rejectKyc(row: Row) {
    try {
      // ✅ update both kyc_submissions + main kyc table
      const { error: subErr } = await supabase
        .from("kyc_submissions")
        .update({ status: "rejected" })
        .eq("id", row.id);

      const { error: kycErr } = await supabase
        .from("kyc")
        .update({ status: "rejected" })
        .eq("user_id", row.user_id);

      if (subErr || kycErr) {
        throw new Error(subErr?.message || kycErr?.message || "Update failed");
      }

      // ✅ update UI state
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, status: "rejected" } : r
        )
      );

      addToast(`✅ KYC for ${row.name} marked as REJECTED`);
    } catch (err: any) {
      console.error("Reject KYC error:", err);
      addToast(`❌ ${err.message}`);
    }
  }

  if (!meAdmin) {
    return <div className="p-6 text-slate-300">Admins only.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl text-slate-100 font-bold mb-4">
        Approved KYC Submissions
      </h1>
      <div className="space-y-4">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-white/10 p-4 bg-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="text-slate-200">
                <div className="font-semibold">{r.name}</div>
                <div className="text-sm opacity-70">
                  PAN: {r.pan_number ?? "—"} | Aadhaar:{" "}
                  {r.aadhaar_number ?? "—"}
                </div>
                <div className="text-xs mt-1 opacity-60">
                  Status: {r.status}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => rejectKyc(r)}
                  className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition"
                >
                  Ban / Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
