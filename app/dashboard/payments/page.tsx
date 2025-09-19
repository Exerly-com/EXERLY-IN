"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import type { MotionProps } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Typed wrapper for motion.button so we can use disabled/onClick without TS errors
type MotionButtonProps = MotionProps & ButtonHTMLAttributes<HTMLButtonElement>;
const MotionButton = (props: MotionButtonProps) => <motion.button {...props} />;

type Payment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

// ✅ Wrapper with Suspense
export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading payments...</div>}>
      <PaymentsPageContent />
    </Suspense>
  );
}

function PaymentsPageContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycApproved, setKycApproved] = useState<boolean | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const checkKycAndFetch = async () => {
      setLoading(true);

      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch KYC status
      const { data: kyc, error: kycError } = await supabase
        .from("kyc")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (kycError) {
        console.error("KYC fetch error:", kycError);
        router.push("/dashboard/kyc");
        return;
      }

      if (!kyc) {
        console.warn("No KYC row found for user");
        router.push("/dashboard/kyc");
        return;
      }

      const status = kyc.status ? kyc.status.toLowerCase() : "";

      if (status !== "approved") {
        console.log("KYC not approved, redirecting. Status:", kyc.status);
        router.push("/dashboard/kyc");
        return;
      }

      setKycApproved(true);

      // Fetch user payments
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setPayments(data || []);

      setLoading(false);
    };

    checkKycAndFetch();
  }, [router]);

  // Capture shipment handoff (if coming from logistics booking)
  useEffect(() => {
    const sid = params.get("shipment");
    if (sid) setShipmentId(sid);
  }, [params]);

  const handlePayNow = async () => {
    if (!shipmentId) return;
    setProcessing(true);

    try {
      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      // Insert payment row
      const { error: payErr } = await supabase.from("payments").insert({
        user_id: user.id,
        order_id: shipmentId,
        amount: 2000, // ✅ placeholder, replace with actual quote total
        currency: "USD",
        status: "completed",
      });
      if (payErr) throw payErr;

      // Update shipment status → booked
      const { error: shipErr } = await supabase
        .from("shipments")
        .update({ status: "booked" })
        .eq("id", shipmentId);
      if (shipErr) throw shipErr;

      alert(`✅ Payment successful for shipment ${shipmentId}`);
      setShipmentId(null);

      // Refresh list
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) setPayments(data || []);
    } catch (err: any) {
      alert("❌ Payment failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || kycApproved === null) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (!kycApproved) {
    return null; // Redirect handled above
  }

  // --- Payments logic ---
  const openPayments = payments.filter(
    (p) => p.status === "pending" || p.status === "in_progress"
  );
  const completedPayments = payments.filter((p) => p.status === "completed");
  const disputes = payments.filter((p) => p.status === "dispute");
  const refunds = payments.filter((p) => p.status === "refunded");
  const scheduled = payments.filter((p) => p.status === "scheduled");

  return (
    <motion.div
      className="p-8 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-3xl font-bold mb-6">💳 Escrow & Payments</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Manage your escrow transactions, releases, disputes, and track history.
      </p>

      {/* Shipment handoff (if booking just completed) */}
      {shipmentId && (
        <Card className="mb-6 bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-2">
              🚢 Payment required for Shipment #{shipmentId}
            </h2>
            <p className="mb-4 text-white/90">
              Please proceed with escrow payment to confirm your booking.
            </p>
            <MotionButton
              whileTap={{ scale: 0.95 }}
              disabled={processing}
              className="px-4 py-2 bg-white text-black rounded-xl shadow hover:shadow-lg transition"
              onClick={handlePayNow}
            >
              {processing ? "Processing..." : "Pay Now"}
            </MotionButton>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="flex gap-3 bg-gray-200 dark:bg-gray-800/40 p-2 rounded-xl">
          <TabsTrigger value="open">Open Payments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Open Payments */}
        <TabsContent value="open" className="mt-6 space-y-4">
          {openPayments.length === 0 ? (
            <p className="text-gray-400">No open payments.</p>
          ) : (
            openPayments.map((p) => (
              <Card
                key={p.id}
                className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 shadow-lg rounded-2xl"
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold">
                        Order #{p.order_id} — {p.currency} {p.amount}
                      </h2>
                      <p className="text-sm text-gray-200">
                        Status: {p.status}
                      </p>
                    </div>
                    <MotionButton
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-white text-black rounded-xl shadow hover:shadow-lg transition"
                    >
                      View Details
                    </MotionButton>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedPayments.length === 0 ? (
            <p className="text-gray-400">No completed payments.</p>
          ) : (
            completedPayments.map((p) => (
              <Card
                key={p.id}
                className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 rounded-2xl"
              >
                <CardContent className="p-5">
                  ✅ Released {p.currency} {p.amount} for Order #{p.order_id}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Disputes */}
        <TabsContent value="disputes" className="mt-6 space-y-4">
          {disputes.length === 0 ? (
            <p className="text-gray-400">No disputes found.</p>
          ) : (
            disputes.map((p) => (
              <Card
                key={p.id}
                className="bg-gradient-to-r from-red-600/80 to-pink-600/80 rounded-2xl"
              >
                <CardContent className="p-5">
                  ⚠️ Dispute raised on Order #{p.order_id} — {p.amount}{" "}
                  {p.currency}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Refunds */}
        <TabsContent value="refunds" className="mt-6 space-y-4">
          {refunds.length === 0 ? (
            <p className="text-gray-400">No refunds yet.</p>
          ) : (
            refunds.map((p) => (
              <Card
                key={p.id}
                className="bg-gradient-to-r from-yellow-600/80 to-orange-600/80 rounded-2xl"
              >
                <CardContent className="p-5">
                  🔄 Refunded {p.currency} {p.amount} — Order #{p.order_id}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Scheduled */}
        <TabsContent value="scheduled" className="mt-6 space-y-4">
          {scheduled.length === 0 ? (
            <p className="text-gray-400">No scheduled releases.</p>
          ) : (
            scheduled.map((p) => (
              <Card
                key={p.id}
                className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 rounded-2xl"
              >
                <CardContent className="p-5">
                  ⏳ Scheduled release: {p.currency} {p.amount} — Order #
                  {p.order_id}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-6">
          <Card className="bg-gray-800/60 dark:bg-gray-200/60 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">📊 Summary</h2>
            <ul className="space-y-2 text-gray-300 dark:text-gray-800">
              <li>Total Payments: {payments.length}</li>
              <li>
                Completed: {completedPayments.length} —{" "}
                {completedPayments.reduce((sum, p) => sum + p.amount, 0)}
              </li>
              <li>Open: {openPayments.length}</li>
              <li>Disputes: {disputes.length}</li>
              <li>Refunds: {refunds.length}</li>
              <li>Scheduled: {scheduled.length}</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
