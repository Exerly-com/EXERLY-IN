import { SITE } from "@/lib/config";
export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/10 mt-20">
      <div className="container py-10 text-sm text-gray-600 dark:text-gray-300 flex flex-col md:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        <p>Made for global trade • Blue / White / Black</p>
      </div>
    </footer>
  );
}
