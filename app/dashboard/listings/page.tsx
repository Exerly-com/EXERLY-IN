import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import ListingsClient from "./ListingsClient";

// ---------- Types ----------
type MediaItem = { url: string };

export type Listing = {
  id: string;
  user_id: string;
  name: string;
  hsn_code: string | null;
  category: string;
  sub_category: string | null;
  photos: MediaItem[];    // ✅ jsonb array
  videos: MediaItem[];    // ✅ jsonb array
  container: string | null;
  packaging_size: string | null;
  packaging_type: string | null;
  origin: string | null;
  delivery_terms: string | null;
  lead_time: string | null;
  price: number | null;
  price_unit: string | null;
  stock: number | null;
  min_order_qty: string | null;
  payment_terms: string | null;
  created_at: string;
};

// ---------- Server Component ----------
export default async function ListingsPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <div className="p-8">Please sign in to manage your listings.</div>;
  }

  // ✅ KYC check server-side
  const { data: kyc } = await supabase
    .from("kyc_submissions")
    .select("status")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!kyc || kyc.status !== "approved") {
    return (
      <div className="p-8">
        You need to complete KYC. <a href="/dashboard/kyc">Go to KYC</a>
      </div>
    );
  }

  // ✅ Fetch initial listings
  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8">Error loading listings</div>;
  }

  return <ListingsClient initialListings={listings || []} userId={session.user.id} />;
}
