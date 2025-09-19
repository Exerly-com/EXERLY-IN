"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

// ---------------- Toast ----------------
type ToastType = "success" | "warning" | "error";
type ToastMessage = { msg: string; type: ToastType } | null;

function Toast({ toast }: { toast: ToastMessage }) {
  if (!toast) return null;

  const colors = {
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600",
  }[toast.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-6 right-6 px-6 py-3 ${colors} text-white rounded-lg shadow-lg`}
      >
        {toast.msg}
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------- Layout ----------------
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide sidebar on these routes
  const noSidebar = ["/dashboard/messages", "/dashboard/account"];
  const hideSidebar = noSidebar.includes(pathname);

  // Theme
  const [darkMode, setDarkMode] = useState(true);
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // Sidebar collapse
  const [collapsed, setCollapsed] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  useEffect(() => {
    if (collapsed) {
      setShowLabels(false);
    } else {
      const t = setTimeout(() => setShowLabels(true), 200);
      return () => clearTimeout(t);
    }
  }, [collapsed]);

  // Toast
  const [toast, setToast] = useState<ToastMessage>(null);
  const showToast = (msg: string, type: ToastType = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const tabs = [
    { label: "Activity", href: "/dashboard" },
    { label: "Messages", href: "/dashboard/messages" },
    { label: "Account", href: "/dashboard/account" },
  ];

  const navItems = [
    { href: "/dashboard/overview", label: "Overview", icon: "🏠" },
    { href: "/dashboard/marketplace", label: "Marketplace", icon: "🛒" },
    { href: "/dashboard/listings", label: "Your Listings", icon: "📦" },
    { href: "/dashboard/kyc", label: "KYC & Compliance", icon: "📝" },
    { href: "/dashboard/payments", label: "Escrow & Payments", icon: "💳" },
    { href: "/dashboard/logistics", label: "Logistics & Docs", icon: "🚚" },
    { href: "/dashboard/financing", label: "Trade Financing", icon: "💰" },
  ];

  // Compute main offset to avoid overlay with fixed sidebar
  const mainOffset = hideSidebar ? 0 : (collapsed ? 80 : 256); // px

  return (
    <div
      className={`relative h-screen overflow-hidden transition-colors duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* -------- Fixed, Non-Scrollable Sidebar (hidden on messages/account) -------- */}
      {!hideSidebar && (
        <motion.aside
          animate={{ width: collapsed ? 80 : 256 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="fixed left-0 top-0 z-30 h-screen bg-gray-950/70 dark:bg-gray-950/70 border-r border-white/10 backdrop-blur flex flex-col justify-between overflow-hidden"
        >
          <div>
            {/* Top Section */}
            <div className="flex items-center justify-between px-4 py-3">
              {showLabels && <span className="font-semibold">Hi Aman anand</span>}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded hover:bg-gray-800"
                aria-label="Toggle sidebar"
              >
                ☰
              </button>
            </div>

            {/* Navigation */}
            <nav className="px-4">
              <ul className="space-y-3">
                {navItems.map((item) => {
                  // Special case: keep Overview active also for nested paths
                  const isActive =
                    item.href === "/dashboard/overview"
                      ? pathname === "/dashboard/overview" || pathname.startsWith("/dashboard/overview/")
                      : pathname === item.href;

                  return (
                    <li key={item.href} className="relative group">
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        <span>{item.icon}</span>
                        {showLabels && !collapsed && item.label}
                      </Link>

                      {/* Tooltip only when collapsed & hovered */}
                      {collapsed && (
                        <span
                          className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 
                            px-3 py-1 text-xs rounded-md shadow-lg whitespace-nowrap
                            bg-gray-900/90 text-white opacity-0 scale-95 
                            group-hover:opacity-100 group-hover:scale-100 transition"
                        >
                          {item.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Bottom Logo */}
          <div className="p-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={collapsed ? 40 : 120}
              height={40}
              className="mx-auto transition-all"
            />
          </div>
        </motion.aside>
      )}

      {/* -------- Main Column -------- */}
      <div
        className="absolute inset-y-0 right-0 flex flex-col h-screen"
        style={{ left: mainOffset }}
      >
        {/* Header */}
        <div
          className={`z-10 flex items-center justify-between px-6 py-3 border-b shadow-lg transition-colors ${
            darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-300"
          }`}
        >
          {/* Left */}
          <div className="text-sm font-medium truncate">anandcoexpt@gmail.com</div>

          {/* Center */}
          <div className="flex flex-col items-center">
            <h1
              className={`font-extrabold tracking-widest text-xl mb-2 ${
                darkMode
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500"
                  : "text-blue-600"
              }`}
            >
              EXERLY
            </h1>
            <div className="flex gap-6">
              {tabs.map((t) => {
                const isActive = pathname === t.href;
                return (
                  <Link key={t.href} href={t.href}>
                    <button
                      className={`px-6 py-1 rounded-xl font-semibold transition-colors ${
                        isActive
                          ? darkMode
                            ? "text-white"
                            : "text-black font-bold"
                          : "text-gray-400 hover:text-blue-500"
                      }`}
                    >
                      {t.label}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            {/* Mode Switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="relative w-16 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-between px-2"
              aria-label="Toggle theme"
            >
              <span>🌞</span>
              <span>🌙</span>
              <motion.div
                animate={{ x: darkMode ? 0 : 32 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow"
              />
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                setToast({ msg: "Logged out successfully", type: "success" });
                setTimeout(() => {
                  localStorage.clear();
                  window.location.href = "/";
                }, 1500);
              }}
              className="px-4 py-2 bg-blue-600 rounded-lg shadow hover:bg-blue-500"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}
