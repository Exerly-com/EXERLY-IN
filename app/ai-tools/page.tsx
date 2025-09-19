import Link from "next/link";
import { Card, CardContent, CardTitle, CardSubtitle } from "@/components/ui/card";

const tools = [
  { href: "/ai-tools/matchmaker", title: "AI Matchmaker", desc: "Search and match buyers/sellers by product, location, and trust." },
  { href: "/ai-tools/risk-scoring", title: "AI Risk Scoring", desc: "Trust score from KYC, trade history, and signals." },
  { href: "/ai-tools/contract-generator", title: "AI Contract Generator", desc: "Generate draft contracts from deal details." },
  { href: "/ai-tools/negotiation-assistant", title: "AI Negotiation Assistant", desc: "Recommended counter-offers and terms." }
];

export default function AIToolsPage() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold mb-6">AI Tools</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {tools.map(t => (
          <Card key={t.href}>
            <CardTitle>{t.title}</CardTitle>
            <CardSubtitle>{t.desc}</CardSubtitle>
            <CardContent>
              <Link className="underline" href={t.href}>Open</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
