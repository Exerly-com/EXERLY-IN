// app/api/enquiry/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service key for inserts
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { listing_id, seller_id, buyer_id, quantity, port, packaging, terms, notes } = body;

    const { data, error } = await supabase
      .from("buying_requirements")
      .insert([{
        listing_id,
        seller_id,
        user_id: buyer_id,
        quantity,
        port,
        packaging,
        terms,
        description: notes,
        status: "new"
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // TODO: trigger notifications + email here
    return NextResponse.json({ success: true, enquiry: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
