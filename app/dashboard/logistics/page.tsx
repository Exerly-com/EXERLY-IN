"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import type { MotionProps } from "framer-motion";
import clsx from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

// ---------- Motion typed wrappers ----------
type MotionButtonProps = MotionProps & ButtonHTMLAttributes<HTMLButtonElement>;
const MotionButton = (props: MotionButtonProps) => <motion.button {...props} />;

type MotionDivProps = MotionProps & HTMLAttributes<HTMLDivElement>;
const MotionDiv = (props: MotionDivProps) => <motion.div {...props} />;

// ---------- UUID without extra dependency ----------
const uuidv4 = () => crypto.randomUUID();

// ---------- Types ----------
type TabKey =
  | "book"
  | "customs"
  | "tracking"
  | "vault"
  | "support";

type ShipmentStatus =
  | "draft"
  | "quote_requested"
  | "quote_ready"
  | "booked"
  | "cancelled";

type CustomsScope = "import" | "export" | "both";
type ContainerSize = "20ft" | "40ft" | "lcl";

type ShipmentForm = {
  id?: string;
  user_id?: string | null;
  origin_port: string;
  destination_port: string;
  container_size: ContainerSize;
  ready_date: string; // ISO date
  customs_scope: CustomsScope;
  insurance: boolean;
  trucking: boolean;
  warehousing: boolean;
  commodity?: string;
  weight_kg?: number;
  volume_cbm?: number;
  notes?: string;
  status?: ShipmentStatus;
};

type Quote = {
  id: string;
  shipment_id: string;
  currency: string;
  total: number;
  breakdown: {
    freight: number;
    customs: number;
    insurance?: number;
    trucking?: number;
    warehousing?: number;
    other?: number;
  };
  valid_until: string; // ISO
};

type UserProfile = {
  id: string;
  email: string | null;
  name: string | null;
};

// ---------- Simple toast helper (fallback if your provider differs) ----------
function useToastFallback() {
  return {
    addToast: (opts: { title?: string; description?: string; variant?: "success" | "error" | "default" }) => {
      const prefix =
        opts.variant === "success" ? "✅ " : opts.variant === "error" ? "❌ " : "ℹ️ ";
      if (opts.title) console.log(prefix + opts.title);
      if (opts.description) console.log(opts.description);
    },
  };
}

// If you already have `useToast` in your project, uncomment this and replace fallback:
// import { useToast } from "@/components/ui/toast-provider";

const tabs: { key: TabKey; label: string }[] = [
  { key: "book", label: "Book Shipment" },
  { key: "customs", label: "Customs & Docs" },
  { key: "tracking", label: "Tracking" },
  { key: "vault", label: "Document Vault" },
  { key: "support", label: "Support" },
];

// ---------- Port data (India ↔ UAE) ----------
const INDIA_PORTS = [
  { code: "INNSA", name: "Nhava Sheva (JNPT), Mumbai" },
  { code: "INMUN", name: "Mundra, Gujarat" },
  { code: "INKOC", name: "Kochi (Cochin), Kerala" },
  { code: "INMAA", name: "Chennai, Tamil Nadu" },
  { code: "INKOL", name: "Kolkata (Kolkata/Haldia), West Bengal" },
  { code: "INVTZ", name: "Visakhapatnam, Andhra Pradesh" },
  { code: "INTUT", name: "Tuticorin (V.O. Chidambaranar), Tamil Nadu" },
  { code: "INHAZ", name: "Hazira, Gujarat" },
  { code: "INIXY", name: "Kandla/Deendayal, Gujarat" },
] as const;

const UAE_PORTS = [
  { code: "AEJEA", name: "Jebel Ali, Dubai" },
  { code: "AEKHL", name: "Khalifa Port, Abu Dhabi" },
  { code: "AEKLF", name: "Khor Fakkan, Sharjah" },
  { code: "AEFJR", name: "Fujairah" },
] as const;

const ALL_ORIGINS = [...INDIA_PORTS, ...UAE_PORTS];
const ALL_DESTINATIONS = [...UAE_PORTS, ...INDIA_PORTS];

// ---------- Motion helpers ----------
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.15 } },
};

// ---------- Main Page ----------
export default function LogisticsAndDocsPage() {
  // const { addToast } = useToast();
  const { addToast } = useToastFallback();
  const router = useRouter();

  const [me, setMe] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("book");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setMe(null);
      setMe({
        id: user.id,
        email: user.email ?? null,
        name: user.user_metadata?.full_name ?? null,
      });
    })();
  }, []);

  return (
    <div className="p-6 md:p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Logistics & Docs
          </h1>
          <p className="text-sm text-white/60">
            Book shipments, clear customs, track containers, and manage all trade documents.
          </p>
        </div>
        <motion.div
          className="hidden md:block rounded-xl px-4 py-2 bg-white/5 border border-white/10 backdrop-blur"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-white/70 text-sm">
            {me?.email ?? "Signed out"}
          </span>
        </motion.div>
      </header>

      {/* Tabs */}
      <nav className="relative mb-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <MotionButton
              key={t.key}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(t.key)}
              className={clsx(
                "px-4 py-2 rounded-xl border transition",
                activeTab === t.key
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white"
              )}
            >
              {t.label}
            </MotionButton>
          ))}
        </div>
      </nav>

      <section className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "book" && (
            <motion.div key="book" {...fadeUp}>
              <BookShipment me={me} addToast={addToast} onBooked={(shipmentId) => {
                router.push(`/dashboard/payments?shipment=${shipmentId}`);
              }} />
            </motion.div>
          )}
          {activeTab === "customs" && (
            <motion.div key="customs" {...fadeUp}>
              <CustomsDocs me={me} addToast={addToast} />
            </motion.div>
          )}
          {activeTab === "tracking" && (
            <motion.div key="tracking" {...fadeUp}>
              <Tracking me={me} />
            </motion.div>
          )}
          {activeTab === "vault" && (
            <motion.div key="vault" {...fadeUp}>
              <DocumentVault me={me} />
            </motion.div>
          )}
          {activeTab === "support" && (
            <motion.div key="support" {...fadeUp}>
              <Support />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

// ============================================================
// Book Shipment (Request Quote → Pay & Book Now)
// ============================================================
function BookShipment({
  me,
  addToast,
  onBooked,
}: {
  me: UserProfile | null;
  addToast: (opts: { title?: string; description?: string; variant?: "success" | "error" | "default" }) => void;
  onBooked: (shipmentId: string) => void;
}) {
  const [form, setForm] = useState<ShipmentForm>({
    origin_port: "INMUN",
    destination_port: "AEJEA",
    container_size: "20ft",
    ready_date: new Date().toISOString().slice(0, 10),
    customs_scope: "both",
    insurance: true,
    trucking: false,
    warehousing: false,
    status: "draft",
  });

  const [isSubmitting, setSubmitting] = useState(false);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [checkingQuote, setCheckingQuote] = useState(false);

  const disabled = useMemo(() => form.status !== "draft", [form.status]);

  const handleChange = <K extends keyof ShipmentForm>(key: K, value: ShipmentForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const requestQuote = async () => {
    if (!me?.id) {
      addToast({ title: "Please sign in", description: "You need to be logged in to request a quote.", variant: "error" });
      return;
    }
    try {
      setSubmitting(true);

      // Create shipment row (status = quote_requested)
      const id = uuidv4();
      const payload = {
        id,
        user_id: me.id,
        origin_port: form.origin_port,
        destination_port: form.destination_port,
        container_size: form.container_size,
        ready_date: form.ready_date,
        customs_scope: form.customs_scope,
        insurance: form.insurance,
        trucking: form.trucking,
        warehousing: form.warehousing,
        commodity: form.commodity ?? null,
        weight_kg: form.weight_kg ?? null,
        volume_cbm: form.volume_cbm ?? null,
        notes: form.notes ?? null,
        status: "quote_requested" as ShipmentStatus,
      };

      const { error } = await supabase.from("shipments").insert(payload);
      if (error) throw error;

      setShipmentId(id);
      setForm((f) => ({ ...f, status: "quote_requested" }));

      addToast({
        title: "Quote requested",
        description: "We’re preparing your custom quote using partner rates + AI.",
        variant: "success",
      });

      // (Optional) Kick off server-side quote generation if you have an RPC/Edge Function
      // await supabase.functions.invoke("generate_quote", { body: { shipment_id: id } });

    } catch (err: any) {
      console.error(err);
      addToast({
        title: "Could not request quote",
        description: err?.message ?? "Unexpected error",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshQuote = async () => {
    if (!shipmentId) return;
    setCheckingQuote(true);
    try {
      // Look for a quote generated for this shipment
      const { data, error } = await supabase
        .from("shipment_quotes")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        addToast({
          title: "Quote not ready yet",
          description: "Please check again in a moment. We’ll also notify you in Messages.",
          variant: "default",
        });
        return;
      }

      const q: Quote = {
        id: data.id,
        shipment_id: data.shipment_id,
        currency: data.currency ?? "USD",
        total: data.total,
        breakdown: data.breakdown ?? { freight: data.total, customs: 0 },
        valid_until: data.valid_until,
      };

      setQuote(q);
      setForm((f) => ({ ...f, status: "quote_ready" }));
      addToast({ title: "Quote ready", description: "Review and proceed to payment.", variant: "success" });
    } catch (err: any) {
      console.error(err);
      addToast({ title: "Error fetching quote", description: err?.message, variant: "error" });
    } finally {
      setCheckingQuote(false);
    }
  };

  const payAndBook = async () => {
    if (!shipmentId || !quote) return;
    try {
      // Mark shipment as booked (you’ll capture payment on /payments)
      const { error } = await supabase
        .from("shipments")
        .update({ status: "booked" as ShipmentStatus })
        .eq("id", shipmentId);

      if (error) throw error;

      onBooked(shipmentId);
    } catch (err: any) {
      addToast({ title: "Booking failed", description: err?.message, variant: "error" });
    }
  };

  const containerCard = (size: ContainerSize, label: string, desc: string) => (
    <MotionButton
      key={size}
      whileHover={{ y: -3, rotateX: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !disabled && handleChange("container_size", size)}
      className={clsx(
        "text-left rounded-2xl p-4 border backdrop-blur transition w-full",
        form.container_size === size
          ? "bg-white/10 border-white/20"
          : "bg-white/5 border-white/10 hover:border-white/20"
      )}
      disabled={disabled}
    >
      <div className="font-semibold">{label}</div>
      <div className="text-sm text-white/70">{desc}</div>
      <div className="mt-2 text-xs text-white/50">No upfront prices. You’ll get a custom AI quote.</div>
    </MotionButton>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left: Form */}
      <motion.div
        className="xl:col-span-2 rounded-2xl p-5 md:p-6 bg-white/5 border border-white/10 backdrop-blur"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold mb-4">Book a Shipment</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Origin Port</label>
            <select
              className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
              value={form.origin_port}
              onChange={(e) => handleChange("origin_port", e.target.value)}
              disabled={disabled}
            >
              {ALL_ORIGINS.map((p) => (
                <option key={p.code} value={p.code} className="bg-gray-900">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Destination Port</label>
            <select
              className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
              value={form.destination_port}
              onChange={(e) => handleChange("destination_port", e.target.value)}
              disabled={disabled}
            >
              {ALL_DESTINATIONS.map((p) => (
                <option key={p.code} value={p.code} className="bg-gray-900">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70 mb-2">Container</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {containerCard("20ft", "20 ft Container", "Ideal for smaller shipments")}
              {containerCard("40ft", "40 ft Container", "Best value for larger loads")}
              {containerCard("lcl", "LCL (Less than Container)", "Pay by volume/weight")}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Ready Date</label>
            <input
              type="date"
              className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
              value={form.ready_date}
              onChange={(e) => handleChange("ready_date", e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Customs</label>
            <div className="grid grid-cols-3 gap-2">
              {(["import", "export", "both"] as CustomsScope[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => !disabled && handleChange("customs_scope", opt)}
                  className={clsx(
                    "rounded-xl px-3 py-2 border text-sm capitalize",
                    form.customs_scope === opt
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                  disabled={disabled}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Commodity (optional)</label>
            <input
              placeholder="e.g. Basmati Rice"
              className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
              value={form.commodity ?? ""}
              onChange={(e) => handleChange("commodity", e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Weight (kg)</label>
            <input
              type="number"
              min={0}
              className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
              value={form.weight_kg ?? ""}
              onChange={(e) => handleChange("weight_kg", Number(e.target.value))}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Volume (CBM)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
              value={form.volume_cbm ?? ""}
              onChange={(e) => handleChange("volume_cbm", Number(e.target.value))}
              disabled={disabled}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70 mb-1">Add-ons</label>
            <div className="flex flex-wrap gap-3">
              <Toggle
                label="Insurance"
                checked={form.insurance}
                onChange={(v) => handleChange("insurance", v)}
                disabled={disabled}
              />
              <Toggle
                label="Trucking"
                checked={form.trucking}
                onChange={(v) => handleChange("trucking", v)}
                disabled={disabled}
              />
              <Toggle
                label="Warehousing"
                checked={form.warehousing}
                onChange={(v) => handleChange("warehousing", v)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70 mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="Any special instructions?"
              className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          {form.status === "draft" && (
            <MotionButton
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={requestQuote}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              {isSubmitting ? "Requesting..." : "Request Quote"}
            </MotionButton>
          )}

          {form.status === "quote_requested" && (
            <>
              <MotionButton
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={refreshQuote}
                disabled={checkingQuote}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white"
              >
                {checkingQuote ? "Checking..." : "Refresh Quote"}
              </MotionButton>
              <span className="text-sm text-white/60">
                We’ll also ping you in <b>Messages</b> when the quote is ready.
              </span>
            </>
          )}

          {form.status === "quote_ready" && quote && (
            <MotionButton
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={payAndBook}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              Pay & Book Now
            </MotionButton>
          )}
        </div>
      </motion.div>

      {/* Right: Live status / Quote */}
      <motion.div
        className="rounded-2xl p-5 md:p-6 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold mb-3">Status</h3>
        <StatusTimeline status={form.status ?? "draft"} />

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Quote</h3>
          {form.status === "draft" && (
            <div className="text-white/60 text-sm">
              Fill details and click <b>Request Quote</b>.
            </div>
          )}

          {form.status === "quote_requested" && (
            <div className="rounded-xl p-4 bg-white/5 border border-white/10 text-sm">
              <div className="animate-pulse">⛴️ Preparing your custom quote…</div>
              <div className="mt-1 text-white/60">
                Based on live carrier rates, schedules, and your add-ons.
              </div>
            </div>
          )}

          {form.status === "quote_ready" && quote && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 bg-white/5 border border-white/10"
            >
              <div className="flex items-baseline justify-between">
                <div className="text-sm text-white/60">Total</div>
                <div className="text-2xl font-bold">
                  {quote.currency} {formatMoney(quote.total)}
                </div>
              </div>
              <div className="mt-3 text-xs text-white/60">
                Valid until: {new Date(quote.valid_until).toLocaleString()}
              </div>
              <div className="mt-3 text-sm">
                <Breakdown breakdown={quote.breakdown} currency={quote.currency} />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        "px-3 py-2 rounded-xl border text-sm",
        checked
          ? "bg-white/10 border-white/20"
          : "bg-white/5 border-white/10 hover:border-white/20"
      )}
      disabled={disabled}
    >
      <span className="mr-1">{checked ? "✅" : "➕"}</span>
      {label}
    </button>
  );
}

function StatusTimeline({ status }: { status: ShipmentStatus }) {
  const steps: { key: ShipmentStatus; label: string }[] = [
    { key: "draft", label: "Draft" },
    { key: "quote_requested", label: "Quote Requested" },
    { key: "quote_ready", label: "Quote Ready" },
    { key: "booked", label: "Booked" },
  ];
  const idx = steps.findIndex((s) => s.key === status);
  return (
    <ol className="relative border-l border-white/10 ml-2">
      {steps.map((s, i) => (
        <li key={s.key} className="mb-4 ml-4">
          <span
            className={clsx(
              "absolute -left-2.5 flex h-4 w-4 items-center justify-center rounded-full border",
              i <= idx ? "bg-emerald-500/80 border-emerald-300/40" : "bg-white/10 border-white/20"
            )}
          />
          <p className={clsx("text-sm", i <= idx ? "text-white" : "text-white/60")}>{s.label}</p>
        </li>
      ))}
    </ol>
  );
}

function Breakdown({
  breakdown,
  currency,
}: {
  breakdown: Quote["breakdown"];
  currency: string;
}) {
  const rows = Object.entries(breakdown).filter(([, v]) => typeof v === "number" && (v as number) > 0) as [string, number][];
  return (
    <div className="space-y-1">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-white/80">
          <span className="capitalize">{k}</span>
          <span className="font-medium">
            {currency} {formatMoney(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ============================================================
// Customs & Docs
// ============================================================
function CustomsDocs({
  me,
  addToast,
}: {
  me: UserProfile | null;
  addToast: (opts: { title?: string; description?: string; variant?: "success" | "error" | "default" }) => void;
}) {
  const [shipmentId, setShipmentId] = useState("");
  const [scope, setScope] = useState<CustomsScope>("both");
  const [isSubmitting, setSubmitting] = useState(false);

  const requestCustomsAssistance = async () => {
    if (!me?.id) {
      addToast({ title: "Please sign in", description: "You need to be logged in.", variant: "error" });
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase.from("customs_requests").insert({
        id: uuidv4(),
        user_id: me.id,
        shipment_id: shipmentId || null,
        scope,
        status: "open",
      });
      if (error) throw error;
      addToast({ title: "Request submitted", description: "Our team will handle documentation & filing.", variant: "success" });
      setShipmentId("");
    } catch (err: any) {
      addToast({ title: "Failed", description: err?.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
        <h3 className="text-xl font-semibold mb-3">Import / Export Customs</h3>
        <p className="text-sm text-white/70 mb-4">
          After booking, we’ll prepare and file your documents: Shipping Bill / Bill of Entry, BoL, COO, Insurance,
          EGM, duty payment, and more.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Shipment ID (optional)</label>
            <input
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              placeholder="Paste Shipment ID to link"
              className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Scope</label>
            <div className="flex gap-2">
              {(["import", "export", "both"] as CustomsScope[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={clsx(
                    "rounded-xl px-3 py-2 border text-sm capitalize",
                    s === scope ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <MotionButton
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={requestCustomsAssistance}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            {isSubmitting ? "Submitting..." : "Request Assistance"}
          </MotionButton>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-gradient-to-b from-white/10 to-white/5 border border-white/10">
        <h3 className="text-xl font-semibold mb-3">What we handle</h3>
        <ul className="space-y-2 text-sm text-white/80">
          <li>• Export: Shipping Bill, Invoice/Packing List verification, BoL, EGM, COO, GST e-way bill</li>
          <li>• Import: Bill of Entry, Duty computation & payment, Delivery Order, Customs examination</li>
          <li>• Certificates: Fumigation, Phyto, Insurance, Test reports</li>
          <li>• Compliance: IEC/GST validation, sanctions screening, KYC mapping</li>
          <li>• Handover: Digital files stored in your Document Vault per shipment</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================
// Tracking
// ============================================================
function Tracking({ me }: { me: UserProfile | null }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      // Minimal example: search by our internal shipment id
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", query)
        .maybeSingle();
      if (error) throw error;
      setResult(data ?? null);
    } catch (err) {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
      <h3 className="text-xl font-semibold mb-3">Track Shipment</h3>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter Shipment ID"
          className="flex-1 bg-transparent border border-white/15 rounded-xl px-3 py-2 outline-none"
        />
        <MotionButton
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={search}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20"
        >
          {loading ? "Searching..." : "Search"}
        </MotionButton>
      </div>

      <div className="mt-5">
        {!result && <div className="text-sm text-white/60">Enter an ID to view status and milestones.</div>}
        {result && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
              <div className="font-medium">Shipment</div>
              <div className="text-sm text-white/70">#{result.id}</div>
              <div className="text-sm mt-2">
                <div>Origin: {result.origin_port}</div>
                <div>Destination: {result.destination_port}</div>
                <div>Container: {result.container_size}</div>
                <div>Status: <span className="capitalize">{result.status}</span></div>
              </div>
            </div>
            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
              <div className="font-medium mb-2">Milestones</div>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• Booking confirmed</li>
                <li>• Customs clearance</li>
                <li>• Loaded on vessel</li>
                <li>• In transit (India ↔ UAE corridor)</li>
                <li>• Arrived at destination port</li>
                <li>• Delivered</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Document Vault
// ============================================================
function DocumentVault({ me }: { me: UserProfile | null }) {
  const [docs, setDocs] = useState<
    { id: string; shipment_id: string | null; title: string; url: string; created_at: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      if (!me?.id) return;
      const { data } = await supabase
        .from("documents")
        .select("id, shipment_id, title, url, created_at")
        .eq("user_id", me.id)
        .order("created_at", { ascending: false });
      setDocs(data ?? []);
    })();
  }, [me?.id]);

  return (
    <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
      <h3 className="text-xl font-semibold mb-4">Your Documents</h3>
      {docs.length === 0 ? (
        <div className="text-sm text-white/60">No documents yet. They’ll appear here after bookings and customs filings.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              className="rounded-xl p-4 bg-white/5 border border-white/10 hover:border-white/20 transition"
            >
              <div className="font-medium">{d.title}</div>
              <div className="text-xs text-white/60 mt-1">
                Shipment: {d.shipment_id ?? "—"}
              </div>
              <div className="text-xs text-white/60">
                {new Date(d.created_at).toLocaleString()}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Support
// ============================================================
function Support() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
        <h3 className="text-xl font-semibold mb-3">Need help?</h3>
        <p className="text-sm text-white/70">
          Chat with EXERLY Logistics Assistant for bookings, customs, or documentation queries.
          We’re available 24×7 for India ↔ UAE trade lanes.
        </p>
        <div className="mt-4">
          <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20">
            Open Chat
          </button>
        </div>
      </div>
      <div className="rounded-2xl p-5 bg-gradient-to-b from-white/10 to-white/5 border border-white/10">
        <h3 className="text-xl font-semibold mb-3">FAQs</h3>
        <ul className="space-y-2 text-sm text-white/80">
          <li>• How long is a quote valid?</li>
          <li>• What documents are needed for export?</li>
          <li>• Can EXERLY arrange trucking & warehousing?</li>
          <li>• How do I claim cargo insurance?</li>
        </ul>
      </div>
    </div>
  );
}
