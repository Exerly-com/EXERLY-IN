"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import clsx from "clsx";
import dynamic from "next/dynamic";

// Lazy-load tesseract so the page stays snappy
const TesseractPromise = import("tesseract.js").then((m) => m.default);

type FileLike = File | null;

type KycRow = {
  id?: string;
  user_id: string;
  name: string;
  address?: string | null;       // ✅ NEW
  company_name?: string | null;  // ✅ NEW
  aadhaar_number?: string | null;
  pan_number?: string | null;
  iec_code?: string | null;
  gstin?: string | null;
  doc_aadhaar_front?: string | null;
  doc_aadhaar_back?: string | null;
  doc_pan?: string | null;
  doc_iec?: string | null;
  doc_gstin?: string | null;
  ai_extracted?: any;
  flags?: any;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  requested_docs?: string[];
};

const prettyCard =
  "rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/40 dark:from-slate-900/60 dark:to-slate-800/40 backdrop-blur p-5 shadow-xl";

// ✅ Light + Dark mode fix
const labelCls = "text-sm font-medium text-gray-900 dark:text-slate-300";
const inputCls =
  "mt-2 w-full rounded-xl border px-3 py-2 placeholder-gray-500 dark:placeholder-slate-500 " +
  "bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
  "dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100";

const btnPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-2 font-medium shadow";
const btnGhost =
  "inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 px-4 py-2 border border-white/10";

const sectionTitle =
  "text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100 mb-2";

const gradientBg =
  "min-h-[calc(100vh-84px)] bg-[radial-gradient(1000px_600px_at_0%_0%,rgba(129,140,248,0.10),transparent),radial-gradient(800px_500px_at_100%_20%,rgba(16,185,129,0.10),transparent)] dark:bg-[radial-gradient(1000px_600px_at_0%_0%,rgba(129,140,248,0.20),transparent),radial-gradient(800px_500px_at_100%_20%,rgba(16,185,129,0.20),transparent)]";

function isValidAadhaar(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return /^\d{12}$/.test(digits) ? digits : null;
}
function isValidPAN(raw: string) {
  const s = raw.toUpperCase().replace(/\s/g, "");
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(s) ? s : null;
}
function isValidGSTIN(raw: string) {
  const s = raw.toUpperCase().replace(/\s/g, "");
  return /^[0-9A-Z]{15}$/.test(s) ? s : null;
}
function extOf(f: File) {
  const n = f.name.split(".");
  return n.length > 1 ? n.pop()! : "dat";
}

function PdfOrImagePreview({ file, url }: { file?: FileLike; url?: string | null }) {
  const [src, setSrc] = useState<string | null>(url ?? null);
  useEffect(() => {
    if (file) {
      const o = URL.createObjectURL(file);
      setSrc(o);
      return () => URL.revokeObjectURL(o);
    }
  }, [file]);
  if (!src) return null;
  const isPdf = (file?.type || "").includes("pdf") || (src?.toLowerCase().endsWith(".pdf"));
  if (isPdf) {
    return (
      <div className="mt-2 h-40 w-full rounded-lg border border-white/10 bg-black/40 flex items-center justify-center text-slate-300">
        <span>PDF attached</span>
      </div>
    );
  }
  return (
    <img src={src} alt="preview" className="mt-2 max-h-40 rounded-lg border border-white/10" />
  );
}

export default function KycPage() {
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");         // ✅
  const [companyName, setCompanyName] = useState(""); // ✅
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [iec, setIec] = useState("");
  const [gstin, setGstin] = useState("");

  // files
  const [aadhaarFront, setAadhaarFront] = useState<FileLike>(null);
  const [aadhaarBack, setAadhaarBack] = useState<FileLike>(null);
  const [panFile, setPanFile] = useState<FileLike>(null);
  const [iecFile, setIecFile] = useState<FileLike>(null);
  const [gstFile, setGstFile] = useState<FileLike>(null);

  // existing storage paths
  const [existing, setExisting] = useState<Partial<KycRow>>({});
  const [status, setStatus] = useState<KycRow["status"]>("draft");

  // AI results/flags
  const [aiExtract, setAiExtract] = useState<any>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [requestedDocs, setRequestedDocs] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setExisting(data);
        setName(data.name ?? "");
        setAddress(data.address ?? "");              // ✅
        setCompanyName(data.company_name ?? "");     // ✅
        setAadhaar(data.aadhaar_number ?? "");
        setPan(data.pan_number ?? "");
        setIec(data.iec_code ?? "");
        setGstin(data.gstin ?? "");
        setStatus(data.status as any);
        setAiExtract(data.ai_extracted ?? {});
        setFlags((data.flags?.issues ?? []) as string[] || []);
        setRequestedDocs(data.requested_docs || []);
      }
    })();
  }, []);

  const canEdit = status === "draft" || status === "rejected";

  async function uploadIfNeeded(file: FileLike, key: string) {
    if (!file) return existing[key as keyof KycRow] as string | undefined;
    const path = `${userId}/kyc/${key}-${Date.now()}.${extOf(file as File)}`;
    const { error } = await supabase.storage.from("kyc-docs").upload(path, file as File, { upsert: false });
    if (error) throw error;
    return path;
  }

  async function runOcrAndChecks() {
    setBusy(true);
    try {
      const Tesseract = await TesseractPromise;
      const reads: Record<string, string | null> = {};

      async function ocrFile(f: FileLike) {
        if (!f) return "";
        const { data: { text } } = await Tesseract.recognize(f as File, "eng");
        return (text || "").replace(/\s+/g, " ").trim();
      }

      const [aadF, aadB, panT] = await Promise.all([
        ocrFile(aadhaarFront),
        ocrFile(aadhaarBack),
        ocrFile(panFile),
      ]);

      const aadhaarFromImg =
        isValidAadhaar(aadF) || isValidAadhaar(aadB) || null;
      const panFromImg = panT ? (panT.match(/[A-Z]{5}\d{4}[A-Z]/i)?.[0] || "").toUpperCase() : "";

      reads["aadhaar_from_img"] = aadhaarFromImg;
      reads["pan_from_img"] = isValidPAN(panFromImg);

      const flagsNow: string[] = [];
      const aadTyped = isValidAadhaar(aadhaar);
      const panTyped = isValidPAN(pan);

      if (aadTyped && reads["aadhaar_from_img"] && aadTyped !== reads["aadhaar_from_img"]) {
        flagsNow.push("Aadhaar typed does not match image text.");
      }
      if (panTyped && reads["pan_from_img"] && panTyped !== reads["pan_from_img"]) {
        flagsNow.push("PAN typed does not match image text.");
      }

      const suspects: string[] = [];
      if (aadTyped) {
        const { data } = await supabase
          .from("kyc_submissions")
          .select("id,user_id,status,name")
          .eq("aadhaar_number", aadTyped)
          .neq("user_id", userId)
          .in("status", ["submitted", "under_review", "approved"]);
        if (data && data.length) suspects.push(`Duplicate Aadhaar already used by another account.`);
      }
      if (panTyped) {
        const { data } = await supabase
          .from("kyc_submissions")
          .select("id,user_id,status,name")
          .eq("pan_number", panTyped)
          .neq("user_id", userId)
          .in("status", ["submitted", "under_review", "approved"]);
        if (data && data.length) suspects.push(`Duplicate PAN already used by another account.`);
      }

      setAiExtract(reads);
      setFlags([...flagsNow, ...suspects]);
    } catch (e: any) {
      setFlags([`OCR error: ${e.message || e}`]);
    } finally {
      setBusy(false);
    }
  }

  async function saveDraftOrSubmit(submit: boolean) {
    if (!userId) return;
    setBusy(true);
    setSaved(false);
    try {
      const doc_aadhaar_front = await uploadIfNeeded(aadhaarFront, "aadhaar-front");
      const doc_aadhaar_back = await uploadIfNeeded(aadhaarBack, "aadhaar-back");
      const doc_pan = await uploadIfNeeded(panFile, "pan");
      const doc_iec = await uploadIfNeeded(iecFile, "iec");
      const doc_gstin = await uploadIfNeeded(gstFile, "gst");

      const payload: KycRow = {
        user_id: userId,
        name,
        address: address || null,              // ✅
        company_name: companyName || null,     // ✅
        aadhaar_number: aadhaar || null,
        pan_number: pan || null,
        iec_code: iec || null,
        gstin: gstin || null,
        doc_aadhaar_front: doc_aadhaar_front ?? existing.doc_aadhaar_front ?? null,
        doc_aadhaar_back: doc_aadhaar_back ?? existing.doc_aadhaar_back ?? null,
        doc_pan: doc_pan ?? existing.doc_pan ?? null,
        doc_iec: doc_iec ?? existing.doc_iec ?? null,
        doc_gstin: doc_gstin ?? existing.doc_gstin ?? null,
        ai_extracted: aiExtract,
        flags: { issues: flags },
        status: submit ? "submitted" : "draft",
        requested_docs: requestedDocs ?? [],
      };

      const { data, error } = await supabase.from("kyc_submissions")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      setExisting(data);
      setStatus(data.status);
      setSaved(true);
      setRequestedDocs(data.requested_docs || []);
    } catch (e: any) {
      alert(e.message || e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={clsx("px-6 md:px-8 pb-20", gradientBg)}>
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
              KYC & Compliance
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              AI-assisted verification for faster onboarding. {email && <span className="opacity-70">({email})</span>}
            </p>
          </div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            {saved && <span className="text-emerald-600 dark:text-emerald-400 self-center text-sm">Saved ✓</span>}
          </motion.div>
        </div>

        {/* STATUS */}
        <div className="mb-6">
          <span
            className={clsx(
              "px-3 py-1 rounded-full text-sm",
              status === "approved" && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
              status === "under_review" && "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30",
              status === "submitted" && "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30",
              status === "rejected" && "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30",
              status === "draft" && "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-slate-300 border border-gray-300 dark:border-white/10"
            )}
          >
            Status: {status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        {/* REQUESTED DOCS */}
        {requestedDocs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={prettyCard}>
            <div className={sectionTitle}>Requested Additional Documents</div>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">
              Our compliance team needs the following items to complete your verification:
            </p>
            <ul className="list-disc pl-5 text-gray-800 dark:text-slate-200 space-y-1">
              {requestedDocs.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* FORM GRID */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* BASIC DETAILS */}
          <motion.div className={prettyCard}>
            <div className={sectionTitle}>Basic Details</div>
            <label className={labelCls}>Full Name</label>
            <input disabled={!canEdit} value={name} onChange={e => setName(e.target.value)} placeholder="As per PAN/Aadhaar" className={inputCls} />
            <label className={`${labelCls} mt-4`}>Address</label> {/* ✅ */}
            <input disabled={!canEdit} value={address} onChange={e => setAddress(e.target.value)} placeholder="Registered Address" className={inputCls} />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Aadhaar Number (12 digits)</label>
                <input disabled={!canEdit} value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="XXXX XXXX XXXX" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>PAN (ABCDE1234F)</label>
                <input disabled={!canEdit} value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" className={inputCls} />
              </div>
            </div>
          </motion.div>

          {/* BUSINESS IDS */}
          <motion.div className={prettyCard}>
            <div className={sectionTitle}>Business Identifiers</div>
            <label className={labelCls}>Company Name</label> {/* ✅ */}
            <input disabled={!canEdit} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Legal Business Name" className={inputCls} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelCls}>IEC Code</label>
                <input disabled={!canEdit} value={iec} onChange={e => setIec(e.target.value)} placeholder="10-digit IEC" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GSTIN / Company Reg. No.</label>
                <input disabled={!canEdit} value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="15-char GSTIN" className={inputCls} />
              </div>
            </div>
          </motion.div>

          {/* AADHAAR FILES */}
          <motion.div className={prettyCard}>
            <div className={sectionTitle}>Aadhaar (Front & Back)</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Front Image</label>
                <input disabled={!canEdit} type="file" accept="image/*" onChange={e => setAadhaarFront(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-gray-900 dark:text-slate-300" />
                <PdfOrImagePreview file={aadhaarFront} url={existing.doc_aadhaar_front ? `/api/storage/signed?path=${encodeURIComponent(existing.doc_aadhaar_front)}` : undefined} />
              </div>
              <div>
                <label className={labelCls}>Back Image</label>
                <input disabled={!canEdit} type="file" accept="image/*" onChange={e => setAadhaarBack(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-gray-900 dark:text-slate-300" />
                <PdfOrImagePreview file={aadhaarBack} url={existing.doc_aadhaar_back ? `/api/storage/signed?path=${encodeURIComponent(existing.doc_aadhaar_back)}` : undefined} />
              </div>
            </div>
          </motion.div>

          {/* PAN, IEC, GST FILES */}
          <motion.div className={prettyCard}>
            <div className={sectionTitle}>Supporting Docs</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>PAN (Front Image)</label>
                <input disabled={!canEdit} type="file" accept="image/*" onChange={e => setPanFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-gray-900 dark:text-slate-300" />
                <PdfOrImagePreview file={panFile} url={existing.doc_pan ? `/api/storage/signed?path=${encodeURIComponent(existing.doc_pan)}` : undefined} />
              </div>
              <div>
                <label className={labelCls}>IEC (Image/PDF)</label>
                <input disabled={!canEdit} type="file" accept="image/*,.pdf" onChange={e => setIecFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-gray-900 dark:text-slate-300" />
                <PdfOrImagePreview file={iecFile} url={existing.doc_iec ? `/api/storage/signed?path=${encodeURIComponent(existing.doc_iec)}` : undefined} />
              </div>
              <div>
                <label className={labelCls}>GSTIN / Company Reg (Image/PDF)</label>
                <input disabled={!canEdit} type="file" accept="image/*,.pdf" onChange={e => setGstFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-gray-900 dark:text-slate-300" />
                <PdfOrImagePreview file={gstFile} url={existing.doc_gstin ? `/api/storage/signed?path=${encodeURIComponent(existing.doc_gstin)}` : undefined} />
              </div>
            </div>
          </motion.div>

          {/* AI CHECK */}
          <motion.div className={prettyCard}>
            <div className="flex items-center justify-between">
              <div className={sectionTitle}>AI Checks</div>
              <button disabled={busy || !canEdit} onClick={runOcrAndChecks} className={btnGhost}>
                {busy ? "Running OCR..." : "Run OCR & Duplicate Check"}
              </button>
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm space-y-1 text-gray-700 dark:text-slate-300">
              <li>Extracts numbers from images and compares with typed values.</li>
              <li>Flags duplicates already used on Exerly.</li>
            </ul>
            {Object.keys(aiExtract || {}).length > 0 && (
              <div className="mt-4 text-sm text-gray-800 dark:text-slate-200">
                <div className="font-semibold mb-1">Extraction:</div>
                <pre className="rounded-lg bg-gray-100 dark:bg-black/40 p-3 border border-gray-200 dark:border-white/10 overflow-x-auto">
{JSON.stringify(aiExtract, null, 2)}
                </pre>
              </div>
            )}
            {flags.length > 0 && (
              <div className="mt-4 text-sm text-rose-600 dark:text-rose-200">
                <div className="font-semibold mb-1">Flags:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {flags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </motion.div>
        </div>

        {/* SAVE / SUBMIT */}
        {status !== "approved" && (
          <div className="mt-8 flex gap-3">
            <button disabled={!canEdit || busy} onClick={() => saveDraftOrSubmit(false)} className={btnGhost}>
              Save Draft
            </button>
            <button disabled={!canEdit || busy} onClick={() => saveDraftOrSubmit(true)} className={btnPrimary}>
              Submit for Review
            </button>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-600 dark:text-slate-400">
          By submitting, you agree Exerly may verify your identity and business documents. Your data is encrypted and stored privately.
        </p>
      </div>
    </div>
  );
}
