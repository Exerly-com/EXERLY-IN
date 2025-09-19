"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<"buying" | "selling">("buying");

  useEffect(() => {
    if (pathname.includes("selling")) setMode("selling");
    else setMode("buying");
  }, [pathname]);

  const spring = { type: "spring", stiffness: 300, damping: 20 };

  const switchMode = (newMode: "buying" | "selling") => {
    setMode(newMode);
    localStorage.setItem("dashboardMode", newMode);
    router.push(`/dashboard/overview/${newMode}`); // ✅ corrected path
  };

  return (
    <div className="flex justify-center mb-8">
      <div className="relative w-80 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center shadow-lg">
        <motion.div
          layout
          transition={spring}
          className="absolute top-1 bottom-1 w-[48%] rounded-full shadow-md bg-white/30 backdrop-blur-xl"
          style={{ left: mode === "buying" ? "2%" : "50%" }}
        />
        <button
          onClick={() => switchMode("buying")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 font-medium ${
            mode === "buying" ? "text-white" : "text-gray-400"
          }`}
        >
          🛒 Buying
        </button>
        <button
          onClick={() => switchMode("selling")}
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
