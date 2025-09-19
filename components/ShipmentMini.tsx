"use client";
import Link from "next/link";

export default function ShipmentMini() {
  return (
    <div className="space-y-5">
      <form className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm mb-1">Origin</label>
          <input
            type="text"
            placeholder="Enter origin city / port"
            className="w-full px-4 py-2 rounded-xl bg-gray-900/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-1">Destination</label>
          <input
            type="text"
            placeholder="Enter destination city / port"
            className="w-full px-4 py-2 rounded-xl bg-gray-900/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Weight (kg)</label>
            <input
              type="number"
              placeholder="e.g. 1200"
              className="w-full px-4 py-2 rounded-xl bg-gray-900/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Volume (cbm)</label>
            <input
              type="number"
              placeholder="e.g. 10"
              className="w-full px-4 py-2 rounded-xl bg-gray-900/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl shadow-md hover:scale-[1.02] transition"
        >
          Book Shipment
        </button>
      </form>

      <Link
        href="/dashboard/logistics"
        className="inline-block text-blue-400 hover:text-blue-300 text-sm mt-2"
      >
        Go to full Logistics page →
      </Link>
    </div>
  );
}
