"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

type Shipment = {
  id: string;
  origin_port: string;
  destination_port: string;
  container_size: string;
  customs_scope: string;
  status: string;
  created_at: string;
};

export default function AdminQuotesPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .in("status", ["quote_requested"]);
      if (!error) setShipments(data);
      setLoading(false);
    })();
  }, []);

  const generateQuote = async (shipmentId: string) => {
    const { error } = await supabase.functions.invoke("generate_quote", {
      body: { shipment_id: shipmentId },
    });
    if (error) alert("Error: " + error.message);
    else alert("Quote generated");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Quote Tool</h1>
      {loading && <div>Loading…</div>}
      {!loading && shipments.length === 0 && (
        <div>No shipments awaiting quotes.</div>
      )}
      <div className="space-y-4">
        {shipments.map((s) => (
          <motion.div
            key={s.id}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
            whileHover={{ y: -2 }}
          >
            <div className="font-medium">Shipment #{s.id}</div>
            <div className="text-sm text-white/70">
              {s.origin_port} → {s.destination_port}
            </div>
            <div className="text-sm text-white/70">
              Container: {s.container_size}, Customs: {s.customs_scope}
            </div>
            <button
              onClick={() => generateQuote(s.id)}
              className="mt-3 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm"
            >
              Generate Quote
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
