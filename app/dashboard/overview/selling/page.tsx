"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardToggle from "@/components/DashboardToggle";
import ShipmentMini from "@/components/ShipmentMini";
import PaymentsMini from "@/components/PaymentsMini";

const tabs = [
  { id: "orders", label: "📋 Orders List" },
  { id: "enquiries", label: "📨 New Enquiries" },
  { id: "shipment", label: "🚚 Book a Shipment" },
  { id: "payments", label: "💳 Payments" },
  { id: "analytics", label: "📊 Analytics" },
];

export default function SellingDashboard() {
  const [active, setActive] = useState("orders");

  return (
    <div className="p-6">
      <DashboardToggle />

      {/* Mini Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 rounded-full transition ${
              active === tab.id
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl min-h-[300px]"
        >
          {active === "shipment" ? (
            <ShipmentMini />
          ) : active === "payments" ? (
            <PaymentsMini />
          ) : (
            <div className="text-gray-400">
              <p>Here will be the real designed UI for <b>{active}</b> tab.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
