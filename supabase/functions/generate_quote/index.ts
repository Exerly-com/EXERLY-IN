// supabase/functions/generate_quote/index.ts
// Fixed: use official Deno std/http import
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    const { shipment_id } = await req.json();
    if (!shipment_id) {
      return new Response(JSON.stringify({ error: "shipment_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Load shipment
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", shipment_id)
      .maybeSingle();

    if (error || !shipment) {
      return new Response(JSON.stringify({ error: "Shipment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Estimate cost
    const base =
      shipment.container_size === "40ft"
        ? 2000
        : shipment.container_size === "20ft"
        ? 1600
        : 800;
    const insurance = shipment.insurance ? base * 0.05 : 0;
    const trucking = shipment.trucking ? 150 : 0;
    const warehousing = shipment.warehousing ? 100 : 0;
    const customs = shipment.customs_scope === "both" ? 250 : 150;

    const total = base + insurance + trucking + warehousing + customs;

    // Insert quote
    const { data: quote, error: qErr } = await supabase
      .from("shipment_quotes")
      .insert({
        shipment_id,
        currency: "USD",
        total,
        breakdown: {
          freight: base,
          insurance,
          trucking,
          warehousing,
          customs,
        },
        valid_until: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      })
      .select()
      .single();

    if (qErr) throw qErr;

    return new Response(JSON.stringify({ success: true, quote }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e.message ?? "Unexpected error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
