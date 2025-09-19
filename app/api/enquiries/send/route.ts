import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Server-only client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Service role key from Supabase settings
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { buyer_id, listing_id, enquiry_text } = await req.json();

    if (!buyer_id || !listing_id || !enquiry_text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Get seller from listing
    const { data: listing, error: listErr } = await supabaseAdmin
      .from("listings")
      .select("user_id")
      .eq("id", listing_id)
      .single();

    if (listErr || !listing) {
      console.error("Listing fetch error:", listErr);
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // 2. Insert enquiry
    const { data: enquiry, error: enquiryErr } = await supabaseAdmin
      .from("enquiries")
      .insert({
        buyer_id,
        listing_id,
        message: enquiry_text,
        status: "open",
      })
      .select()
      .single();

    if (enquiryErr) {
      console.error("Enquiry insert error:", enquiryErr);
      return NextResponse.json({ error: "Failed to insert enquiry" }, { status: 500 });
    }

    // 3. Insert message Buyer → Seller
    const { error: msgErr1 } = await supabaseAdmin.from("messages").insert({
      sender_id: buyer_id,
      receiver_id: listing.user_id,
      content: enquiry_text,
      is_enquiry: true,
      enquiry_id: enquiry.id,
    });
    if (msgErr1) console.error("Message insert error (buyer→seller):", msgErr1);

    // 4. Insert message Buyer → Admin
    const ADMIN_ID = process.env.ADMIN_USER_ID;
    if (ADMIN_ID) {
      const { error: msgErr2 } = await supabaseAdmin.from("messages").insert({
        sender_id: buyer_id,
        receiver_id: ADMIN_ID,
        content: `[CC] ${enquiry_text}`,
        is_enquiry: true,
        enquiry_id: enquiry.id,
        is_admin_copy: true,
      });
      if (msgErr2) console.error("Message insert error (buyer→admin):", msgErr2);
    }

    return NextResponse.json({ success: true, enquiry });
  } catch (err) {
    console.error("Route crash:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
