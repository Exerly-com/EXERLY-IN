"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast-provider";

type Row = {
  id: string;
  user_id: string;
  name: string;
  address: string | null;        // ✅ NEW
  company_name: string | null;   // ✅ NEW
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
  requested_docs: string[] | null;
};

export default function KycAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [meAdmin, setMeAdmin] = useState(false);
  const [viewRow, setViewRow] = useState<Row | null>(null);
  const { addToast } = useToast();
  const [reqNote, setReqNote] = useState<Record<string, string>>({}); // id -> note

useEffect(() => {
  (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    console.log("DEBUG profile:", profile, "error:", profErr);

    const isAdmin = profile?.is_admin === true || profile?.is_admin === "t";
    setMeAdmin(isAdmin);
    if (!isAdmin) return;

    const { data } = await supabase
      .from("kyc_submissions")
      .select("*")
      .in("status", ["submitted", "under_review"])
      .order("created_at", { ascending: false });

    setRows(data || []);
  })();
}, []);

  async function setStatus(id: string, status: "under_review" | "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      addToast(`✅ KYC marked as ${status.toUpperCase()}`);

      // ✅ also update main kyc table
      const row = rows.find(r => r.id === id);
      if (row) {
        const { error: kycErr } = await supabase
          .from("kyc")
          .update({ status })
          .eq("user_id", row.user_id);
        if (kycErr) console.error("Failed to update main kyc table:", kycErr);
      }
    } catch (e: any) {
      addToast(`❌ ${e.message}`);
    }
  }

  async function addRequest(id: string) {
    const note = (reqNote[id] || "").trim();
    if (!note) {
      addToast("Enter a request note before adding");
      return;
    }
    try {
      const current = rows.find(r => r.id === id);
      const newList = [...(current?.requested_docs || []), note];

      const { error } = await supabase
        .from("kyc_submissions")
        .update({ requested_docs: newList })
        .eq("id", id);

      if (error) throw error;

      setRows(prev => prev.map(r => r.id === id ? { ...r, requested_docs: newList } : r));
      setReqNote(prev => ({ ...prev, [id]: "" }));
      addToast("✅ Request added");
    } catch (e: any) {
      addToast(`❌ ${e.message}`);
    }
  }

  if (!meAdmin) return <div className="p-6 text-slate-300">Admins only.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl text-slate-100 font-bold">KYC Review Queue</h1>

      {rows.map(r => (
        <div key={r.id} className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="text-slate-200">
              <div className="font-semibold">{r.name}</div>
              {r.company_name && (
                <div className="text-sm text-indigo-300">Company: {r.company_name}</div>
              )}
              {r.address && (
                <div className="text-xs text-slate-400">Address: {r.address}</div>
              )}
              <div className="text-sm opacity-70">
                PAN: {r.pan_number ?? "—"} | Aadhaar: {r.aadhaar_number ?? "—"}
              </div>
              <div className="text-xs mt-1 opacity-60">Status: {r.status}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewRow(r)}
                className="px-3 py-1 rounded bg-slate-700 text-white hover:bg-slate-600"
              >
                View
              </button>
              <button
                onClick={() => setStatus(r.id, "under_review")}
                className="px-3 py-1 rounded bg-amber-500 text-black hover:bg-amber-600"
              >
                Under Review
              </button>
              <button
                onClick={() => setStatus(r.id, "approved")}
                className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Approve
              </button>
              <button
                onClick={() => setStatus(r.id, "rejected")}
                className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
              >
                Reject
              </button>
            </div>
          </div>

          {r.flags?.issues?.length ? (
            <ul className="mt-2 text-rose-200 text-sm list-disc pl-5">
              {r.flags.issues.map((f: string, i: number) => <li key={i}>{f}</li>)}
            </ul>
          ) : null}

          <div className="mt-3 text-xs">
            <a className="underline text-indigo-300" href={`/api/storage/signed?path=${encodeURIComponent(r.doc_pan || "")}`} target="_blank">PAN</a>{" · "}
            <a className="underline text-indigo-300" href={`/api/storage/signed?path=${encodeURIComponent(r.doc_aadhaar_front || "")}`} target="_blank">Aadhaar Front</a>{" · "}
            <a className="underline text-indigo-300" href={`/api/storage/signed?path=${encodeURIComponent(r.doc_aadhaar_back || "")}`} target="_blank">Aadhaar Back</a>{" · "}
            <a className="underline text-indigo-300" href={`/api/storage/signed?path=${encodeURIComponent(r.doc_iec || "")}`} target="_blank">IEC</a>{" · "}
            <a className="underline text-indigo-300" href={`/api/storage/signed?path=${encodeURIComponent(r.doc_gstin || "")}`} target="_blank">GST</a>
          </div>

          {/* ✅ Requested docs input/UI */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="text-sm text-slate-300 font-medium">Request additional document</div>
            <div className="flex gap-2">
              <input
                value={reqNote[r.id] || ""}
                onChange={(e) => setReqNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                placeholder="e.g., Please upload latest GST certificate"
                className="flex-1 rounded-lg bg-slate-900/40 border border-white/10 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => addRequest(r.id)}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Add Request
              </button>
            </div>

            {r.requested_docs && r.requested_docs.length > 0 && (
              <div className="text-xs text-slate-400">
                <div className="mt-2 font-semibold text-slate-300">Already requested:</div>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {r.requested_docs.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* View modal */}
      {viewRow && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              KYC Details - {viewRow.name}
            </h2>
            <div className="space-y-2 text-slate-200 text-sm">
              <p><b>Company:</b> {viewRow.company_name || "—"}</p>
              <p><b>Address:</b> {viewRow.address || "—"}</p>
              <p><b>PAN:</b> {viewRow.pan_number || "—"}</p>
              <p><b>Aadhaar:</b> {viewRow.aadhaar_number || "—"}</p>
              <p><b>Status:</b> {viewRow.status}</p>
            </div>
            <div className="mt-4">
              <a className="underline text-indigo-300 mr-3" href={`/api/storage/signed?path=${encodeURIComponent(viewRow.doc_pan || "")}`} target="_blank">PAN</a>
              <a className="underline text-indigo-300 mr-3" href={`/api/storage/signed?path=${encodeURIComponent(viewRow.doc_aadhaar_front || "")}`} target="_blank">Aadhaar Front</a>
              <a className="underline text-indigo-300 mr-3" href={`/api/storage/signed?path=${encodeURIComponent(viewRow.doc_aadhaar_back || "")}`} target="_blank">Aadhaar Back</a>
              <a className="underline text-indigo-300 mr-3" href={`/api/storage/signed?path=${encodeURIComponent(viewRow.doc_iec || "")}`} target="_blank">IEC</a>
              <a className="underline text-indigo-300" href={`/api/storage/signed?path=${encodeURIComponent(viewRow.doc_gstin || "")}`} target="_blank">GST</a>
            </div>
            <button
              onClick={() => setViewRow(null)}
              className="mt-6 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
