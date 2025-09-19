"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardToggle from "@/components/DashboardToggle";

const tabs = [
  { id: "enquiries", label: "📨 Sent Enquiries" },
  { id: "orders", label: "📦 Orders" },
  { id: "quotes", label: "💬 Received Quotes" },
  { id: "payments", label: "💳 Payments" },
  { id: "delivered", label: "✅ Delivered Orders" },
];

export default function BuyingDashboard() {
  const [active, setActive] = useState("enquiries");

  return (
    <div className="p-6">
      <DashboardToggle /> {/* toggle added */}

      {/* Mini Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 rounded-full transition ${
              active === tab.id
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20, rotateX: -10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -20, rotateX: 10 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl min-h-[300px]"
        >
          <h2 className="text-xl font-semibold mb-4 capitalize">{tabs.find(t => t.id === active)?.label}</h2>
          <p className="text-gray-400">Buying content for {active} goes here.</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
