"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OverviewPage() {
  const [mode, setMode] = useState<"buying" | "selling">("buying");
  const router = useRouter();

  useEffect(() => {
    const saved = (localStorage.getItem("dashboardMode") as "buying" | "selling") || "buying";
    setMode(saved);
  }, []);

  useEffect(() => {
    if (mode) {
      localStorage.setItem("dashboardMode", mode);
      router.push(`/dashboard/overview/${mode}`); // ✅ now correct
    }
  }, [mode, router]);

  const spring = { type: "spring", stiffness: 300, damping: 20 };

  return (
    <div className="flex justify-center mt-20">
      <div className="relative w-80 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center shadow-lg">
        <motion.div
          layout
          transition={spring}
          className="absolute top-1 bottom-1 w-[48%] rounded-full shadow-md bg-white/30 backdrop-blur-xl"
          style={{ left: mode === "buying" ? "2%" : "50%" }}
        />
        <button
          onClick={() => setMode("buying")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 font-medium ${
            mode === "buying" ? "text-white" : "text-gray-400"
          }`}
        >
          🛒 Buying
        </button>
        <button
          onClick={() => setMode("selling")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 font-medium ${
            mode === "selling" ? "text-white" : "text-gray-400"
          }`}
        >
          📦 Selling
        </button>
      </div>
    </div>
  );
}
