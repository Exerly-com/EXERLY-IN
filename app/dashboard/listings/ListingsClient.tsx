"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  motion,
  AnimatePresence,
  type MotionProps,
} from "framer-motion";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import type { Listing } from "./page";

// ---------- Motion typed wrappers ----------
type MotionButtonProps = MotionProps & ButtonHTMLAttributes<HTMLButtonElement>;
const MotionButton = (props: MotionButtonProps) => <motion.button {...props} />;

type MotionDivProps = MotionProps & HTMLAttributes<HTMLDivElement>;
const MotionDiv = (props: MotionDivProps) => <motion.div {...props} />;

// ---------- Constants ----------
const CONTAINERS = ["20ft", "40ft", "40ft High Cube", "LCL / Pallet"];
const PACK_TYPES = ["Bag", "Box", "Carton", "Drum", "Bulk"];
const INCOTERMS = ["FOB", "CIF", "CFR", "EXW", "DAP", "DDP"];
const CATEGORIES = [
  "Agriculture",
  "Textiles",
  "Chemicals",
  "Metals",
  "Food & Beverage",
  "Electronics",
  "Automotive",
  "Other",
];

type MediaObj = { url: string; _remove?: boolean };

export default function ListingsClient({
  initialListings,
  userId,
}: {
  initialListings: Listing[];
  userId: string;
}) {
  // ---------- Data ----------
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Listing | null>(null);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [viewing, setViewing] = useState<Listing | null>(null);

  // ---------- UI state ----------
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  // ---------- Form state ----------
  const [name, setName] = useState("");
  const [hsn, setHSN] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subCategory, setSubCategory] = useState("");
  const [container, setContainer] = useState(CONTAINERS[0]);
  const [packSize, setPackSize] = useState("");
  const [packType, setPackType] = useState(PACK_TYPES[0]);
  const [origin, setOrigin] = useState("");
  const [delivery, setDelivery] = useState("FOB");
  const [lead, setLead] = useState("7-10 days");
  const [price, setPrice] = useState<number | "">("");
  const [priceUnit, setPriceUnit] = useState("per kg");
  const [stock, setStock] = useState<number | "">("");
  const [moq, setMoq] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Escrow on EXERLY");

  // ✅ Media state (new uploads)
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  // ✅ Existing media for EDIT (with ability to mark for deletion)
  const [existingPhotos, setExistingPhotos] = useState<MediaObj[]>([]);
  const [existingVideos, setExistingVideos] = useState<MediaObj[]>([]);

  const canCreateMore = useMemo(() => listings.length < 50, [listings.length]);

  // ---------- Helpers ----------
  const refreshListings = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setListings(data as Listing[]);
  };

  const resetForm = () => {
    setEditing(null);
    setName("");
    setHSN("");
    setCategory(CATEGORIES[0]);
    setSubCategory("");
    setContainer(CONTAINERS[0]);
    setPackSize("");
    setPackType(PACK_TYPES[0]);
    setOrigin("");
    setDelivery("FOB");
    setLead("7-10 days");
    setPrice("");
    setPriceUnit("per kg");
    setStock("");
    setMoq("");
    setPaymentTerms("Escrow on EXERLY");
    setPhotoFiles([]);
    setVideoFiles([]);
    setExistingPhotos([]);
    setExistingVideos([]);
  };

  const publicBase =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/`;

  // ✅ Upload helper
  const uploadFiles = async (files: File[], folder: string) => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() || "bin";
      const filePath = `${userId}/${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("listings").upload(filePath, file);
      if (error) throw error;
      const publicUrl = `${publicBase}${filePath}`;
      urls.push(publicUrl);
    }
    return urls;
  };

  // ---------- CRUD ----------
  const onCreate = async () => {
    if (!userId) return alert("Please login first.");
    if (!name.trim()) return alert("Product name is required.");
    if (!canCreateMore) return alert("Free plan allows max 50 listings.");

    try {
      setCreating(true);

      const photosToUpload = photoFiles.slice(0, 5);
      const videosToUpload = videoFiles.slice(0, 2);

      const [photoUrls, videoUrls] = await Promise.all([
        uploadFiles(photosToUpload, "photos"),
        uploadFiles(videosToUpload, "videos"),
      ]);

      const { error } = await supabase.from("listings").insert([
        {
          name,
          hsn_code: hsn || null,
          category,
          sub_category: subCategory || null,
          container,
          packaging_size: packSize || null,
          packaging_type: packType,
          origin: origin || null,
          delivery_terms: delivery,
          lead_time: lead,
          price: price === "" ? null : Number(price),
          price_unit: priceUnit,
          stock: stock === "" ? null : Number(stock),
          min_order_qty: moq || null,
          payment_terms: paymentTerms || null,
          photos: photoUrls.map((u) => ({ url: u })),   // ✅ save jsonb
          videos: videoUrls.map((u) => ({ url: u })),   // ✅ save jsonb
        },
      ]);

      if (error) throw error;

      resetForm();
      setShowForm(false);
      await refreshListings();
    } catch (e: any) {
      alert(e.message ?? "Failed to create listing.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (l: Listing) => {
    setEditing(l);
    setShowForm(true);
    setName(l.name ?? "");
    setHSN(l.hsn_code ?? "");
    setCategory(l.category ?? CATEGORIES[0]);
    setSubCategory(l.sub_category ?? "");
    setContainer(l.container ?? CONTAINERS[0]);
    setPackSize(l.packaging_size ?? "");
    setPackType(l.packaging_type ?? PACK_TYPES[0]);
    setOrigin(l.origin ?? "");
    setDelivery(l.delivery_terms ?? "FOB");
    setLead(l.lead_time ?? "7-10 days");
    setPrice(l.price ?? "");
    setPriceUnit(l.price_unit ?? "per kg");
    setStock(l.stock ?? "");
    setMoq(l.min_order_qty ?? "");
    setPaymentTerms(l.payment_terms ?? "Escrow on EXERLY");

    // load existing media for remove/keep
    setExistingPhotos((l.photos ?? []).map((p) => ({ url: p.url })));
    setExistingVideos((l.videos ?? []).map((v) => ({ url: v.url })));

    setPhotoFiles([]);
    setVideoFiles([]);
  };

  const onUpdate = async () => {
    if (!editing) return;
    try {
      setCreating(true);

      // 1) Upload NEW media (if any)
      let newPhotoUrls: string[] = [];
      let newVideoUrls: string[] = [];

      if (photoFiles.length > 0) {
        newPhotoUrls = await uploadFiles(photoFiles.slice(0, 5), "photos");
      }
      if (videoFiles.length > 0) {
        newVideoUrls = await uploadFiles(videoFiles.slice(0, 2), "videos");
      }

      // 2) Work out media to keep vs remove
      const keepPhotos = existingPhotos.filter((p) => !p._remove).map((p) => p.url);
      const keepVideos = existingVideos.filter((v) => !v._remove).map((v) => v.url);

      const removePhotos = existingPhotos.filter((p) => p._remove).map((p) => p.url);
      const removeVideos = existingVideos.filter((v) => v._remove).map((v) => v.url);

      // 3) Delete removed media from storage
      const toRemoveKeys: string[] = [];
      [...removePhotos, ...removeVideos].forEach((url) => {
        if (url.startsWith(publicBase)) {
          toRemoveKeys.push(url.slice(publicBase.length));
        }
      });
      if (toRemoveKeys.length) {
        await supabase.storage.from("listings").remove(toRemoveKeys);
      }

      // 4) Build final arrays to store
      const finalPhotos = [
        ...keepPhotos.map((u) => ({ url: u })),
        ...newPhotoUrls.map((u) => ({ url: u })),
      ];
      const finalVideos = [
        ...keepVideos.map((u) => ({ url: u })),
        ...newVideoUrls.map((u) => ({ url: u })),
      ];

      // 5) Update row
      const { error } = await supabase
        .from("listings")
        .update({
          name,
          hsn_code: hsn || null,
          category,
          sub_category: subCategory || null,
          container,
          packaging_size: packSize || null,
          packaging_type: packType,
          origin: origin || null,
          delivery_terms: delivery,
          lead_time: lead,
          price: price === "" ? null : Number(price),
          price_unit: priceUnit,
          stock: stock === "" ? null : Number(stock),
          min_order_qty: moq || null,
          payment_terms: paymentTerms || null,
          photos: finalPhotos,
          videos: finalVideos,
        })
        .eq("id", editing.id);

      if (error) throw error;

      resetForm();
      setShowForm(false);
      await refreshListings();
    } catch (e: any) {
      alert(e.message ?? "Failed to update listing.");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (l: Listing) => {
    setConfirmDelete(l); // open confirm modal
  };

  const actuallyDelete = async (l: Listing) => {
    try {
      setDeletingId(l.id);

      // delete all media from storage
      const toRemove: string[] = [];
      for (const urlObj of [...(l.photos ?? []), ...(l.videos ?? [])]) {
        const url = urlObj.url;
        if (url.startsWith(publicBase)) toRemove.push(url.slice(publicBase.length));
      }
      if (toRemove.length) {
        await supabase.storage.from("listings").remove(toRemove);
      }

      // delete row
      const { error } = await supabase.from("listings").delete().eq("id", l.id);
      if (error) throw error;

      await refreshListings();
    } catch (e: any) {
      alert(e.message ?? "Failed to delete listing.");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  // ---------- Filtered ----------
  const filtered = listings
    .filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
    .filter((l) => filterCat === "All" || l.category === filterCat);

  // ---------- Small helpers ----------
  const pretty = (v: any) => (v === null || v === "" ? "-" : String(v));

  return (
    <div className="px-6 md:px-10 py-8 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your Listings</h1>

        {!showForm && (
          <MotionButton
            type="button"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-2xl px-4 py-2 font-medium shadow-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            disabled={!canCreateMore}
          >
            Create New Listing
          </MotionButton>
        )}
      </div>

      {/* Search */}
      {!showForm && (
        <div className="mb-4 flex gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="form-input flex-1"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="form-input w-40"
          >
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* List */}
      {!showForm && (
        <div className="rounded-2xl border bg-white dark:bg-slate-900/40 backdrop-blur dark:border-white/10">
          <div className="max-h-[480px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-white/60">
                  No listings yet.
                </div>
              ) : (
                filtered.map((l) => (
                  <motion.div
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-4 px-4 py-3 border-b dark:border-white/10"
                  >
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-black/30">
                      {l.photos?.[0]?.url ? (
                        <img src={l.photos[0].url} alt={l.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-xs text-gray-500 dark:text-white/60">
                          No img
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-semibold">{l.name}</div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/10">
                          {l.category}
                        </span>
                      </div>
                      <div className="mt-0.5 text-sm">
                        {pretty(l.price)} USD {pretty(l.price_unit)} • Stock: {pretty(l.stock)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <MotionButton
                        onClick={() => setViewing(l)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg transition"
                      >
                        View
                      </MotionButton>

                      <MotionButton
                        onClick={() => startEdit(l)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-md hover:shadow-lg transition"
                      >
                        Edit
                      </MotionButton>

                      <MotionButton
                        onClick={() => onDelete(l)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={deletingId === l.id}
                        className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md hover:shadow-lg transition disabled:opacity-60"
                      >
                        {deletingId === l.id ? "Deleting…" : "Delete"}
                      </MotionButton>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ----------------- FORM (Create / Edit) ----------------- */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl mt-6 border bg-white dark:bg-slate-900/40 backdrop-blur p-6 dark:border-white/10"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Product Name *">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Basmati Rice 1121" className="form-input" />
            </Field>
            <Field label="HSN Code">
              <input value={hsn} onChange={(e) => setHSN(e.target.value)} placeholder="1006" className="form-input" />
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Sub Category (Optional)">
              <input value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="Pulses" className="form-input" />
            </Field>

            {/* ✅ Existing photos (for EDIT) */}
            {editing && (
              <Field label="Existing Photos">
                <div className="mt-2 flex gap-2 flex-wrap">
                  {existingPhotos.length === 0 ? <div className="text-sm opacity-70">No photos</div> : existingPhotos.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p.url} className="h-20 w-20 rounded-xl object-cover border border-white/10" />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...existingPhotos];
                          next[i]._remove = !next[i]._remove;
                          setExistingPhotos(next);
                        }}
                        className={`absolute -top-2 -right-2 text-xs rounded-full px-2 py-1 shadow ${
                          p._remove
                            ? "bg-rose-600 text-white"
                            : "bg-gray-200 text-black dark:bg-white/10 dark:text-white"
                        }`}
                      >
                        {p._remove ? "Remove" : "Keep"}
                      </button>
                    </div>
                  ))}
                </div>
              </Field>
            )}

            {/* ✅ Existing videos (for EDIT) */}
            {editing && (
              <Field label="Existing Videos">
                <div className="mt-2 flex gap-2 flex-wrap">
                  {existingVideos.length === 0 ? <div className="text-sm opacity-70">No videos</div> : existingVideos.map((v, i) => (
                    <div key={i} className="relative">
                      <video src={v.url} controls className="h-20 w-28 rounded-xl border border-white/10" />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...existingVideos];
                          next[i]._remove = !next[i]._remove;
                          setExistingVideos(next);
                        }}
                        className={`absolute -top-2 -right-2 text-xs rounded-full px-2 py-1 shadow ${
                          v._remove
                            ? "bg-rose-600 text-white"
                            : "bg-gray-200 text-black dark:bg-white/10 dark:text-white"
                        }`}
                      >
                        {v._remove ? "Remove" : "Keep"}
                      </button>
                    </div>
                  ))}
                </div>
              </Field>
            )}

            {/* ✅ New Media upload */}
            <Field label={`Add Photos ${editing ? "(replacements optional)" : "(up to 5)"}`}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []).slice(0,5))}
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {photoFiles.map((f, i) => (
                  <img key={i} src={URL.createObjectURL(f)} className="h-20 w-20 rounded-xl object-cover" />
                ))}
              </div>
            </Field>

            <Field label={`Add Videos ${editing ? "(replacements optional)" : "(up to 2)"}`}>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={(e) => setVideoFiles(Array.from(e.target.files ?? []).slice(0,2))}
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {videoFiles.map((f, i) => (
                  <video key={i} src={URL.createObjectURL(f)} controls className="h-20 w-28 rounded-xl" />
                ))}
              </div>
            </Field>

            {/* Rest fields */}
            <Field label="Container">
              <select value={container} onChange={(e) => setContainer(e.target.value)} className="form-input">
                {CONTAINERS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Packaging Size">
              <input value={packSize} onChange={(e) => setPackSize(e.target.value)} placeholder="50 kg" className="form-input" />
            </Field>
            <Field label="Packaging Type">
              <select value={packType} onChange={(e) => setPackType(e.target.value)} className="form-input">
                {PACK_TYPES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Origin">
              <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="India" className="form-input" />
            </Field>
            <Field label="Delivery Terms">
              <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className="form-input">
                {INCOTERMS.map((i) => <option key={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Lead Time">
              <input value={lead} onChange={(e) => setLead(e.target.value)} placeholder="7-10 days" className="form-input" />
            </Field>
            <Field label="Price (USD)">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="500"
                  className="form-input flex-1"
                />
                <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className="form-input w-28">
                  <option>per kg</option>
                  <option>per mt</option>
                  <option>per unit</option>
                </select>
              </div>
            </Field>
            <Field label="Stock">
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="1000"
                className="form-input"
              />
            </Field>
            <Field label="Minimum Order Quantity">
              <input value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="1 container" className="form-input" />
            </Field>
            <Field label="Payment Terms">
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Escrow on EXERLY" className="form-input" />
            </Field>
          </div>

          <div className="mt-6 flex gap-3">
            <MotionButton
              onClick={editing ? onUpdate : onCreate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={creating}
              className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {creating ? "Saving…" : editing ? "Update Listing" : "Create Listing"}
            </MotionButton>
            <MotionButton
              onClick={() => {resetForm(); setShowForm(false);}}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-2xl bg-gray-200 dark:bg-white/10"
            >
              Cancel
            </MotionButton>
          </div>
        </motion.div>
      )}

      {/* ----------------- VIEW MODAL ----------------- */}
      <AnimatePresence>
        {viewing && (
          <MotionDiv
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            onClick={() => setViewing(null)}
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          >
            <MotionDiv
              onClick={(e)=>e.stopPropagation()}
              className="w-full max-w-3xl rounded-2xl border bg-white dark:bg-slate-900 p-6 dark:border-white/10"
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold">{viewing.name}</h3>
                <button onClick={()=>setViewing(null)} className="rounded-full px-3 py-1 bg-gray-200 dark:bg-white/10">Close</button>
              </div>

              {/* Media */}
              <div className="mt-2">
                <div className="font-medium mb-2">Photos</div>
                <div className="flex gap-3 overflow-x-auto">
                  {viewing.photos?.length ? viewing.photos.map((p,i)=>(
                    <img key={i} src={p.url} className="h-32 w-44 object-cover rounded-xl" />
                  )) : <div className="text-sm opacity-70">No photos uploaded.</div>}
                </div>
              </div>

              <div className="mt-4">
                <div className="font-medium mb-2">Videos</div>
                <div className="flex gap-3 overflow-x-auto">
                  {viewing.videos?.length ? viewing.videos.map((v,i)=>(
                    <video key={i} src={v.url} controls className="h-32 w-44 rounded-xl" />
                  )) : <div className="text-sm opacity-70">No videos uploaded.</div>}
                </div>
              </div>

              {/* Details grid */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <KV k="Category" v={viewing.category} />
                <KV k="Sub Category" v={viewing.sub_category} />
                <KV k="HSN Code" v={viewing.hsn_code} />
                <KV k="Container" v={viewing.container} />
                <KV k="Packaging Size" v={viewing.packaging_size} />
                <KV k="Packaging Type" v={viewing.packaging_type} />
                <KV k="Origin" v={viewing.origin} />
                <KV k="Delivery Terms" v={viewing.delivery_terms} />
                <KV k="Lead Time" v={viewing.lead_time} />
                <KV k="Price" v={`${pretty(viewing.price)} ${pretty(viewing.price_unit)}`} />
                <KV k="Stock" v={pretty(viewing.stock)} />
                <KV k="Min Order Qty" v={pretty(viewing.min_order_qty)} />
                <KV k="Payment Terms" v={pretty(viewing.payment_terms)} />
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* ----------------- CONFIRM DELETE MODAL ----------------- */}
      <AnimatePresence>
        {confirmDelete && (
          <MotionDiv
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
            onClick={() => setConfirmDelete(null)}
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          >
            <MotionDiv
              onClick={(e)=>e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border bg-white dark:bg-slate-900 p-6 dark:border-white/10"
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold">Delete listing?</h3>
              <p className="mt-2 text-sm opacity-80">
                This will permanently delete <b>{confirmDelete.name}</b> and all its photos and videos from storage.
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <MotionButton
                  onClick={() => setConfirmDelete(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-full bg-gray-200 dark:bg-white/10"
                >
                  Cancel
                </MotionButton>
                <MotionButton
                  onClick={() => actuallyDelete(confirmDelete)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md hover:shadow-lg"
                >
                  Confirm Delete
                </MotionButton>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Small helpers ----------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-sm opacity-80">{label}</div>
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-36 text-gray-600 dark:text-white/60">{k}</div>
      <div className="flex-1 font-medium">{v ?? "-"}</div>
    </div>
  );
}
