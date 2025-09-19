'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./utils";
import ThemeSwitcher from "./ThemeSwitcher";
import Image from "next/image";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products by Category" },
  { href: "/about", label: "About Us" },
  { href: "/help", label: "Help & Contact" }
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative bg-white dark:bg-black border-b border-gray-200 dark:border-white/10">
      <div className="container flex items-center justify-between py-3">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 h-16 md:h-28">
          <div className="relative w-32 h-full md:w-60">
            <Image
              src="/logo.png"
              alt="EXERLY"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="sr-only">EXERLY</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition",
                "bg-transparent text-black hover:bg-brand-blue hover:text-white shadow-sm",
                "dark:text-white dark:hover:bg-brand-blue",
                pathname === l.href && "bg-brand-blue text-white shadow-md"
              )}
            >
              {l.label}
            </Link>
          ))}

          <Link
            href="/login"
            className="px-5 py-2 rounded-full text-sm font-semibold transition shadow-md bg-brand-blue text-white hover:bg-black hover:text-brand-blue"
          >
            Login / Signup
          </Link>

          <div className="ml-4">
            <ThemeSwitcher />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <span className="text-2xl font-bold">✕</span>
          ) : (
            <span className="text-2xl">☰</span>
          )}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-500 ease-in-out",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black">
          <div className="flex flex-col p-4 space-y-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition",
                  "bg-transparent text-black hover:bg-brand-blue hover:text-white",
                  "dark:text-white dark:hover:bg-brand-blue",
                  pathname === l.href && "bg-brand-blue text-white"
                )}
              >
                {l.label}
              </Link>
            ))}

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition",
                "bg-brand-blue text-white hover:bg-black hover:text-brand-blue"
              )}
            >
              Login / Signup
            </Link>

            <div className="pt-2">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
