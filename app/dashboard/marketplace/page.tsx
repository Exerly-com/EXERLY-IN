"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type MediaItem = { url: string };
type Listing = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  sub_category: string | null;
  origin: string | null;
  price: number | null;
  price_unit: string | null;
  photos: MediaItem[] | null;
  created_at: string;
};

type SellerCard = {
  user_id: string;
  name: string;        // from profiles.company_name or fallback
  country?: string;    // from profiles.country if available
  listings: number;
};

type BuyingRequirement = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  quantity: string | null;
  location: string | null;
  created_at: string;
};

const CATEGORIES = [
  "all",
  "Agriculture",
  "Textiles",
  "Chemicals",
  "Metals",
  "Food & Beverage",
  "Electronics",
  "Automotive",
  "Other",
];

const COUNTRIES = [
  "all",
  "India",
  "China",
  "Germany",
  "Ukraine",
  "Chile",
  "Switzerland",
];

export default function MarketplacePage() {
  const router = useRouter();
  const params = useSearchParams();
  const viewModeParam = params.get("view"); // "all" triggers full grid

  // -------- Auth/KYC gate (keeps your original behavior) --------
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("kyc_submissions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      const ok = data && data.status === "approved";
      if (!ok) window.location.href = "/dashboard/kyc?reason=need_kyc";
    })();
  }, []);

  // -------- UI state --------
  const [mode, setMode] = useState<"products" | "sellers" | "buyers">("products");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // data
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [topListings, setTopListings] = useState<Listing[]>([]);
  const [sellerCards, setSellerCards] = useState<SellerCard[]>([]);
  const [buyerNeeds, setBuyerNeeds] = useState<BuyingRequirement[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<SellerCard | null>(null);

  // ✅ ADDED: selection + enquiry modal state (only new lines)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showEnquiry, setShowEnquiry] = useState(false);

  // -------- initial load --------
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // fetch latest listings for top items + base grid
        const { data: ls } = await supabase
          .from("listings")
          .select("id,user_id,name,category,sub_category,origin,price,price_unit,photos,created_at")
          .order("created_at", { ascending: false })
          .limit(48);
        setListings(ls || []);
        setTopListings((ls || []).slice(0, 8));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // -------- search handler --------
  const runSearch = async () => {
    setLoading(true);
    try {
      if (mode === "products") {
        // Query listings by name/category/origin, with optional filters
        let q = supabase
          .from("listings")
          .select("id,user_id,name,category,sub_category,origin,price,price_unit,photos,created_at")
          .order("created_at", { ascending: false });

        if (query.trim()) {
          const term = `%${query.trim()}%`;
          q = q.or(`name.ilike.${term},category.ilike.${term},sub_category.ilike.${term},origin.ilike.${term}`);
        }
        if (category !== "all") q = q.eq("category", category);
        // Country filter: we don't have a country col guaranteed; try origin as proxy
        if (country !== "all") q = q.ilike("origin", `%${country}%`);
        // Price filters if numeric
        const minNum = Number(minPrice);
        const maxNum = Number(maxPrice);
        if (!Number.isNaN(minNum) && minPrice !== "") q = q.gte("price", minNum);
        if (!Number.isNaN(maxNum) && maxPrice !== "") q = q.lte("price", maxNum);

        const { data } = await q;
        setListings(data || []);
        setSellerCards([]);
        setBuyerNeeds([]);
      }

      if (mode === "sellers") {
        // Find listings that match term; then group unique sellers
        let q = supabase
          .from("listings")
          .select("user_id,name,category,sub_category,origin")
          .limit(1000);

        if (query.trim()) {
          const term = `%${query.trim()}%`;
          q = q.or(`name.ilike.${term},category.ilike.${term},sub_category.ilike.${term},origin.ilike.${term}`);
        }
        if (category !== "all") q = q.eq("category", category);
        if (country !== "all") q = q.ilike("origin", `%${country}%`);

        const { data: ls } = await q;

        const counts = new Map<string, number>();
        (ls || []).forEach((r) => {
          counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1);
        });

        // Try join with profiles table if it exists
        let cards: SellerCard[] = [];
        const ids = Array.from(counts.keys());
        if (ids.length) {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("id,company_name,country")
            .in("id", ids);
          if (!error && prof) {
            const byId = new Map(prof.map((p) => [p.id, p]));
            cards = ids.map((id) => {
              const p = byId.get(id as any);
              return {
                user_id: id,
                name: p?.company_name || `Seller ${id.slice(0, 6)}`,
                country: p?.country || undefined,
                listings: counts.get(id) || 0,
              };
            });
          } else {
            cards = ids.map((id) => ({
              user_id: id,
              name: `Seller ${id.slice(0, 6)}`,
              listings: counts.get(id) || 0,
            }));
          }
        }

        // Shuffle (random order on every search/refresh for large lists)
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cards[i], cards[j]] = [cards[j], cards[i]];
        }

        setSellerCards(cards);
        setListings([]);
        setBuyerNeeds([]);
      }

      if (mode === "buyers") {
        // Search a future table: buying_requirements
        let q = supabase
          .from("buying_requirements")
          .select("id,user_id,title,description,category,quantity,location,created_at")
          .order("created_at", { ascending: false });

        if (query.trim()) {
          const term = `%${query.trim()}%`;
          q = q.or(`title.ilike.${term},description.ilike.${term},category.ilike.${term},location.ilike.${term}`);
        }
        if (category !== "all") q = q.eq("category", category);
        if (country !== "all") q = q.ilike("location", `%${country}%`);

        const { data, error } = await q;
        if (error && error.code === "42P01") {
          // table not ready yet → safe fallback
          setBuyerNeeds([]);
        } else {
          setBuyerNeeds(data || []);
        }
        setListings([]);
        setSellerCards([]);
      }
    } finally {
      setLoading(false);
    }

    // Always expand the page when searching
    if (viewModeParam !== "all") router.push("/dashboard/marketplace?view=all");
  };

  // -------- Top sellers (for Trusted Sellers) from current listings --------
  const trustedSellers = useMemo<SellerCard[]>(() => {
    const counts = new Map<string, number>();
    listings.forEach((l) => counts.set(l.user_id, (counts.get(l.user_id) || 0) + 1));
    const cards = Array.from(counts.entries())
      .map(([user_id, listings]) => ({
        user_id,
        name: `Seller ${user_id.slice(0, 6)}`,
        listings,
      }))
      .sort((a, b) => b.listings - a.listings)
      .slice(0, 8);
    return cards;
  }, [listings]);

  const prettyPrice = (p: number | null, unit?: string | null) =>
    p == null ? "-" : `${p} ${unit ?? ""}`.trim();

  const goAll = () => router.push("/dashboard/marketplace?view=all");

  return (
    <div className="space-y-8">
      {/* ---------------- Search Bar ---------------- */}
      <div className="bg-gradient-to-r from-white/90 to-gray-100 dark:from-gray-900 dark:to-gray-800 backdrop-blur-lg rounded-xl px-4 sm:px-6 py-4 shadow-md">
        <div className="flex gap-2 items-stretch">
          <div className="relative">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="h-full px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm font-medium outline-none"
            >
              <option value="products">Products</option>
              <option value="sellers">Sellers</option>
              <option value="buyers">Buyers</option>
            </select>
          </div>
          <input
            type="text"
            placeholder={`Search ${mode === "products" ? "product name, category, origin…" :
              mode === "sellers" ? "seller’s products…" :
              "buying requirements…"}`}
            className="w-full px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm font-medium outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <button
            onClick={runSearch}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md hover:scale-105 transition active:scale-95"
            aria-label="Search"
          >
            🔎
          </button>
        </div>
      </div>

      {/* ---------------- Filters ---------------- */}
      <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-white/90 to-gray-100 dark:from-gray-900 dark:to-gray-800 backdrop-blur-lg rounded-xl px-4 sm:px-6 py-4 shadow-md">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm font-medium outline-none"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm font-medium outline-none"
        >
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <input
          type="number"
          inputMode="decimal"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm outline-none w-28"
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm outline-none w-28"
        />

        <button
          onClick={runSearch}
          className="ml-auto px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-md hover:scale-105 transition"
        >
          Apply Filters
        </button>
      </div>

      {/* ---------------- Category Chips ---------------- */}
      <div>
        <h2 className="text-xl font-bold mb-3">Top Categories</h2>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); runSearch(); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition
                ${category === c
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- Results / Top Items ---------------- */}
      {viewModeParam === "all" ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Marketplace</h2>
          </div>

          {/* PRODUCTS MODE */}
          {mode === "products" && (
            <>
              {loading ? (
                <SkeletonGrid />
              ) : listings.length === 0 ? (
                <EmptyState label="No products found." />
              ) : (
                /* ✅ ADDED: use clickable grid (we are not removing your ProductsGrid; just using another component) */
                <ProductsGridOpen items={listings} onOpen={(l) => setSelectedListing(l)} />
              )}
            </>
          )}

          {/* SELLERS MODE */}
          {mode === "sellers" && (
            <>
              {loading ? (
                <SkeletonGrid />
              ) : sellerCards.length === 0 ? (
                <EmptyState label="No sellers found." />
              ) : (
                <SellersGrid
                  items={sellerCards}
                  onOpen={(s) => setSelectedSeller(s)}
                />
              )}
            </>
          )}

          {/* BUYERS MODE */}
          {mode === "buyers" && (
            <>
              {loading ? (
                <SkeletonGrid />
              ) : buyerNeeds.length === 0 ? (
                <EmptyState label="No buying requirements found." />
              ) : (
                <BuyersList items={buyerNeeds} />
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Top Items (REAL LISTINGS) */}
          <div>
            <h2 className="text-xl font-bold mb-3">Top Items</h2>
            {loading ? (
              <SkeletonGrid />
            ) : topListings.length === 0 ? (
              <EmptyState label="No products yet. Be the first to list!" />
            ) : (
              <>
                {/* ✅ ADDED: clickable top items grid */}
                <ProductsGridOpen items={topListings} onOpen={(l) => setSelectedListing(l)} />
                <div className="text-right mt-4">
                  <button
                    onClick={goAll}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-md hover:scale-105 transition"
                  >
                    View All Products →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Trusted Sellers (from actual listings) */}
          <div>
            <h2 className="text-xl font-bold mb-3">Trusted Sellers</h2>
            {loading ? (
              <SkeletonGrid />
            ) : trustedSellers.length === 0 ? (
              <EmptyState label="No sellers yet." />
            ) : (
              <SellersGrid items={trustedSellers} onOpen={(s) => setSelectedSeller(s)} />
            )}
          </div>
        </>
      )}

      {/* ---------------- Seller Profile Modal ---------------- */}
      <AnimatePresence>
        {selectedSeller && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedSeller(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md border dark:border-white/10"
            >
              <h2 className="text-xl font-bold mb-2">
                {selectedSeller.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Listings: {selectedSeller.listings}
              </p>
              {selectedSeller.country && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Country: {selectedSeller.country}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="px-4 py-2 rounded-full bg-gray-200 dark:bg-white/10"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                >
                  View Seller
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ ADDED: Listing Details Modal */}
      <ListingDetailsModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onEnquiry={() => setShowEnquiry(true)}
      />

      {/* ✅ ADDED: Enquiry Modal */}
      <EnquiryModal
        open={showEnquiry}
        onClose={() => setShowEnquiry(false)}
        listing={selectedListing}
      />
    </div>
  );
}

/* ---------------- UI SUBCOMPONENTS ---------------- */

/* (UNCHANGED) original ProductsGrid kept exactly as you wrote it */
function ProductsGrid({ items }: { items: Listing[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((p) => (
        <motion.div
          key={p.id}
          whileHover={{ y: -6, scale: 1.02 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-white to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
        >
          <div className="h-32 w-full rounded-xl overflow-hidden bg-gray-300 dark:bg-gray-700 mb-4 grid place-items-center">
            {p.photos?.[0]?.url ? (
              <img src={p.photos[0].url} className="h-full w-full object-cover" alt={p.name} />
            ) : (
              <span className="text-3xl">📦</span>
            )}
          </div>
          <h3 className="text-lg font-semibold truncate">{p.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {p.price == null ? "-" : `${p.price} ${p.price_unit ?? ""}`}
          </p>
          <p className="text-xs mt-1">{p.origin ?? "-"}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ✅ ADDED: Clickable grid version (does not replace your original) */
function ProductsGridOpen({ items, onOpen }: { items: Listing[]; onOpen: (l: Listing) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((p) => (
        <motion.div
          key={p.id}
          whileHover={{ y: -6, scale: 1.02 }}
          onClick={() => onOpen(p)}
          className="cursor-pointer p-5 rounded-2xl bg-gradient-to-br from-white to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
        >
          <div className="h-32 w-full rounded-xl overflow-hidden bg-gray-300 dark:bg-gray-700 mb-4 grid place-items-center">
            {p.photos?.[0]?.url ? (
              <img src={p.photos[0].url} className="h-full w-full object-cover" alt={p.name} />
            ) : (
              <span className="text-3xl">📦</span>
            )}
          </div>
          <h3 className="text-lg font-semibold truncate">{p.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {p.price == null ? "-" : `${p.price} ${p.price_unit ?? ""}`}
          </p>
          <p className="text-xs mt-1">{p.origin ?? "-"}</p>
        </motion.div>
      ))}
    </div>
  );
}

function SellersGrid({
  items,
  onOpen,
}: {
  items: SellerCard[];
  onOpen: (s: SellerCard) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((s) => (
        <motion.div
          key={s.user_id}
          whileHover={{ y: -4, scale: 1.01 }}
          onClick={() => onOpen(s)}
          className="cursor-pointer p-5 rounded-2xl bg-gradient-to-br from-green-500/90 to-emerald-700/90 text-white shadow-lg ring-1 ring-black/5"
        >
          <h3 className="text-lg font-semibold truncate">{s.name}</h3>
          <p className="text-sm">Listings: {s.listings}</p>
          {s.country && <p className="text-xs opacity-90 mt-1">{s.country}</p>}
        </motion.div>
      ))}
    </div>
  );
}

function BuyersList({ items }: { items: BuyingRequirement[] }) {
  return (
    <div className="space-y-3">
      {items.map((b) => (
        <motion.div
          key={b.id}
          whileHover={{ y: -3 }}
          className="p-4 rounded-xl bg-white dark:bg-gray-900 border dark:border-white/10 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold">{b.title}</div>
              <div className="text-xs opacity-70 mt-0.5">
                {b.category ?? "-"} • {b.location ?? "-"} • Qty: {b.quantity ?? "-"}
              </div>
              {b.description && (
                <p className="text-sm opacity-90 mt-2 line-clamp-2">{b.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow">
                View
              </button>
              <button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow">
                Quote
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-56 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-10 text-center rounded-2xl bg-white dark:bg-gray-900 border dark:border-white/10">
      <div className="text-3xl mb-2">🧐</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

/* ✅ ADDED: Listing Details Modal (new) */
function ListingDetailsModal({
  listing,
  onClose,
  onEnquiry,
}: {
  listing: Listing | null;
  onClose: () => void;
  onEnquiry: () => void;
}) {
  return (
    <AnimatePresence>
      {listing && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-2xl border dark:border-white/10"
          >
            <h2 className="text-xl font-bold">{listing.name}</h2>
            <p className="text-sm opacity-80 mt-1">
              {listing.category} {listing.sub_category ? `• ${listing.sub_category}` : ""} • {listing.origin ?? "-"}
            </p>
            <p className="text-base font-semibold mt-2">
              {listing.price == null ? "-" : `${listing.price} ${listing.price_unit ?? ""}`}
            </p>

            <div className="mt-4 flex gap-3 overflow-x-auto">
              {listing.photos?.length
                ? listing.photos.map((m, i) => (
                    <img key={i} src={m.url} className="h-32 w-44 rounded-xl object-cover" />
                  ))
                : <div className="text-sm opacity-70">No media uploaded.</div>
              }
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10">Close</button>
              <button
                onClick={onEnquiry}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow"
              >
                Send Enquiry
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ✅ ADDED: Enquiry Modal (new) — inserts to enquiries, messages, emails */
function EnquiryModal({
  open,
  onClose,
  listing,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing | null;
}) {
  const [quantity, setQuantity] = useState("");
  const [destinationPort, setDestinationPort] = useState("");
  const [packagingSize, setPackagingSize] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("FOB");
  const [paymentTerms, setPaymentTerms] = useState("Escrow on EXERLY");
  const [targetPrice, setTargetPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const reset = () => {
    setQuantity("");
    setDestinationPort("");
    setPackagingSize("");
    setDeliveryTerms("FOB");
    setPaymentTerms("Escrow on EXERLY");
    setTargetPrice("");
    setNotes("");
  };

  const submit = async () => {
    if (!listing) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in to send an enquiry.");
        setSending(false);
        return;
      }

      // 1) primary: insert into 'enquiries'
      let insertedOk = false;
      let errMsg = "";

      const payload = {
        listing_id: listing.id,
        seller_id: listing.user_id,
        buyer_id: user.id,
        quantity,
        destination_port: destinationPort,
        packaging_size: packagingSize,
        delivery_terms: deliveryTerms,
        payment_terms: paymentTerms,
        target_price: targetPrice || null,
        notes: notes || null,
        status: "new",
      };

      const { error: e1 } = await supabase.from("enquiries").insert([payload]);
      if (!e1) {
        insertedOk = true;
      } else if (e1?.code === "42P01") {
        // 1b) fallback: 'buying_requirements' (if enquiries table not yet created)
        const { error: e2 } = await supabase.from("buying_requirements").insert([{
          user_id: user.id,
          title: `Enquiry for ${listing.name}`,
          description: `Qty: ${quantity}, Dest: ${destinationPort}, Pack: ${packagingSize}, Incoterms: ${deliveryTerms}, Pay: ${paymentTerms}${targetPrice ? `, Target: ${targetPrice}` : ""}${notes ? `, Notes: ${notes}` : ""}`,
          category: listing.category,
          quantity,
          location: destinationPort,
        }]);
        if (!e2) insertedOk = true;
        else errMsg = e2.message || "Failed to save enquiry.";
      } else {
        errMsg = e1.message || "Failed to save enquiry.";
      }

      // 2) in-app message to seller (best-effort)
      async function submitEnquiry({
  buyerId,
  sellerId,        // pass this from the card/listing (listing.user_id)
  listingId,
  message,
  targetPrice,     // number | undefined
  notes,           // string | undefined
}: {
  buyerId: string;
  sellerId: string;
  listingId: string;
  message: string;
  targetPrice?: number;
  notes?: string;
}) {
  try {
    // 1) create enquiry
    const { data: enquiry, error: e1 } = await supabase
      .from("enquiries")
      .insert({
        buyer_id: buyerId,
        listing_id: listingId,
        message,
        target_price: targetPrice ?? null,
        status: "open",
        // optional notes if you keep a notes column; else remove this field
        // notes: notes ?? null,
      })
      .select("id")     // get the id back
      .single();

    if (e1) throw e1;

    // 2) first chat message (buyer -> seller)
    const { error: e2 } = await supabase.from("messages").insert({
      sender_id: buyerId,
      receiver_id: sellerId,
      content: message,
      is_enquiry: true,
      enquiry_id: enquiry.id,
    });
    if (e2) {
      // we don't crash the flow if the message insert fails — just log it
      console.error("message insert failed:", e2);
    }

    // 3) optional: CC admin (if you configured one)
    const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    if (ADMIN_ID) {
      const { error: e3 } = await supabase.from("messages").insert({
        sender_id: buyerId,
        receiver_id: ADMIN_ID,
        content: `[CC] ${message}`,
        is_enquiry: true,
        enquiry_id: enquiry.id,
        is_admin_copy: true,
      });
      if (e3) console.warn("admin CC failed:", e3);
    }

    // 4) success UI
    // showToast("Enquiry sent!");
    return { ok: true, enquiryId: enquiry.id };
  } catch (err) {
    console.error("submitEnquiry failed:", err);
    // showToast("Failed to send enquiry");
    return { ok: false, error: String(err) };
  }
}


      // 3) email to seller via API route (best-effort)
      if (insertedOk) {
        try {
          await fetch("/api/send-enquiry-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              seller_id: listing.user_id,
              listing: { id: listing.id, name: listing.name },
              enquiry: {
                quantity,
                destination_port: destinationPort,
                packaging_size: packagingSize,
                delivery_terms: deliveryTerms,
                payment_terms: paymentTerms,
                target_price: targetPrice || null,
                notes: notes || null,
              },
            }),
          });
        } catch {}
      }

      if (!insertedOk) {
        alert(errMsg || "Could not submit enquiry.");
      } else {
        alert("Enquiry sent ✅");
        reset();
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && listing && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-xl border dark:border-white/10"
          >
            <h3 className="text-lg font-semibold">Send Enquiry — {listing.name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <div className="mb-1 text-sm">Quantity</div>
                <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g., 25 MT" className="form-input w-full" />
              </div>
              <div>
                <div className="mb-1 text-sm">Destination Port</div>
                <input value={destinationPort} onChange={(e) => setDestinationPort(e.target.value)} placeholder="e.g., Nhava Sheva" className="form-input w-full" />
              </div>
              <div>
                <div className="mb-1 text-sm">Packaging Size</div>
                <input value={packagingSize} onChange={(e) => setPackagingSize(e.target.value)} placeholder="e.g., 50 kg bags" className="form-input w-full" />
              </div>
              <div>
                <div className="mb-1 text-sm">Delivery Terms (Incoterms)</div>
                <input value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} placeholder="FOB / CIF / CFR / EXW / DAP / DDP" className="form-input w-full" />
              </div>
              <div>
                <div className="mb-1 text-sm">Payment Terms</div>
                <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g., Escrow on EXERLY" className="form-input w-full" />
              </div>
              <div>
                <div className="mb-1 text-sm">Target Price (optional)</div>
                <input value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="e.g., 500 USD/MT" className="form-input w-full" />
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 text-sm">Additional Notes</div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quality specs, certifications, delivery window, etc." className="form-input w-full min-h-[88px]" />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10">Cancel</button>
              <button onClick={submit} disabled={sending} className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow">
                {sending ? "Sending…" : "Submit Enquiry"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
