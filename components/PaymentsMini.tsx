"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Payment = {
  id: string;
  invoice_no: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
  created_at: string;
};

export default function PaymentsMini() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select("id, invoice_no, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5); // mini preview shows only latest 5

      if (!error && data) setPayments(data as Payment[]);
      setLoading(false);
    };

    fetchPayments();
  }, []);

  return (
    <div className="space-y-5">
      {loading ? (
        <p className="text-gray-400">Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="text-gray-400">No recent payments found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900/40">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60 text-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Invoice</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-gray-700">
                  <td className="px-4 py-2">{p.invoice_no}</td>
                  <td className="px-4 py-2">${p.amount.toLocaleString()}</td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      p.status === "Paid"
                        ? "text-green-400"
                        : p.status === "Pending"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/dashboard/payments"
        className="inline-block text-blue-400 hover:text-blue-300 text-sm mt-2"
      >
        Go to full Payments page →
      </Link>
    </div>
  );
}
