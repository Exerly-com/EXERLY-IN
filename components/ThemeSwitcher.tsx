'use client';

import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved theme OR fallback to system theme
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const systemTheme: "light" | "dark" = prefersDark ? "dark" : "light";
      setTheme(systemTheme);
      document.documentElement.classList.toggle("dark", systemTheme === "dark");
    }
    setMounted(true);
  }, []);

  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  }

  if (!mounted) return null;

  return (
    <label className="inline-flex items-center cursor-pointer gap-2">
      <span className="text-lg">🌞</span>
      <input
        type="checkbox"
        className="sr-only"
        checked={theme === "dark"}
        onChange={toggleTheme}
      />
      <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative transition">
        <div
          className={`w-6 h-6 bg-white rounded-full shadow absolute top-0 transition-transform duration-300 ${
            theme === "dark" ? "translate-x-6" : "translate-x-0"
          }`}
        ></div>
      </div>
      <span className="text-lg">🌙</span>
    </label>
  );
}
