"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductsPage() {
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const products = [
    {
      name: "Basmati Rice",
      price: "$120 / ton",
      country: "🇮🇳 India",
      seller: "AgroWorld Traders",
    },
    {
      name: "Refined Sunflower Oil",
      price: "$85 / ton",
      country: "🇺🇦 Ukraine",
      seller: "Global Agro LLC",
    },
    {
      name: "Steel Sheets",
      price: "$400 / ton",
      country: "🇨🇳 China",
      seller: "SinoSteel Ltd.",
    },
    {
      name: "Machinery Tools",
      price: "$2500 / unit",
      country: "🇩🇪 Germany",
      seller: "Euro Machinery GmbH",
    },
    {
      name: "Organic Turmeric",
      price: "$99 / ton",
      country: "🇮🇳 India",
      seller: "Spice Exports",
    },
  ];

  const categories = ["all", "Textiles", "Agriculture", "Chemicals", "Auto Parts", "Electronics", "Metals", "Pharma"];
  const countries = ["all", "India", "China", "Germany", "Ukraine", "Chile", "Switzerland"];

  const filteredProducts = products.filter((p) => {
    return (
      (category === "all" || p.name.toLowerCase().includes(category.toLowerCase())) &&
      (country === "all" || p.country.includes(country))
    );
  });

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-white/90 to-gray-100 dark:from-gray-900 dark:to-gray-800 
        backdrop-blur-lg rounded-xl px-6 py-4 shadow-md">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-sm font-medium outline-none"
        >
          {categories.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-sm font-medium outline-none"
        >
          {countries.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Min Price"
          className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-sm outline-none w-24"
        />
        <input
          type="text"
          placeholder="Max Price"
          className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-sm outline-none w-24"
        />
        <button className="ml-auto px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 
          text-white font-semibold shadow-md hover:scale-105 transition">
          Apply Filters
        </button>
      </div>

      {/* Products Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {filteredProducts.map((p, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -6, scale: 1.02 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-white to-gray-200 
              dark:from-gray-800 dark:to-gray-900 shadow-lg ring-1 ring-black/5 
              dark:ring-white/10 cursor-pointer"
          >
            {/* Image */}
            <div className="h-32 w-full bg-gray-300 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
              <span className="text-4xl">📦</span>
            </div>

            {/* Info */}
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{p.price}</p>
            <p className="text-xs mt-1">Seller: {p.seller}</p>
            <p className="text-xs">{p.country}</p>
            <button
              onClick={() => setSelectedProduct(p)}
              className="mt-3 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 
              text-white text-sm font-semibold hover:scale-105 transition"
            >
              Contact Seller →
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-2">
                Contact Seller – {selectedProduct.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Seller: {selectedProduct.seller} ({selectedProduct.country})
              </p>

              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 outline-none"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 outline-none"
                />
                <textarea
                  placeholder="Write your inquiry..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 
                  text-white font-semibold hover:scale-105 transition"
                >
                  Send Inquiry ✅
                </button>
              </form>

              <button
                onClick={() => setSelectedProduct(null)}
                className="mt-4 text-sm text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
