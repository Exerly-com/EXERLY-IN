import { Card, CardContent, CardTitle, CardSubtitle } from "@/components/ui/card";

const sections = [
  { id: "marketplace", title: "Marketplace (Verified Buyers/Sellers)", desc: "Create listings, discover partners, exchange RFQs and finalize deals." },
  { id: "escrow", title: "Escrow & Payments", desc: "Secure milestones, multi-currency support, FX quotes and compliant payouts." },
  { id: "kyc", title: "AI Compliance & KYC", desc: "KYC/KYB onboarding, sanctions/PEP screening, document verification." },
  { id: "logistics", title: "Logistics + Docs", desc: "Generate trade documents, manage shipments, attach proof and track status." },
  { id: "financing", title: "Trade Financing", desc: "Access working capital via invoice/PO finance partners." }
];

export default function ProductPage() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Product</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {sections.map(s => (
          <Card key={s.id} id={s.id}>
            <CardTitle>{s.title}</CardTitle>
            <CardSubtitle>{s.desc}</CardSubtitle>
            <CardContent>
              <ul className="list-disc pl-6 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>Role-based access, audit trails</li>
                <li>File uploads with storage</li>
                <li>Notifications & status updates</li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
