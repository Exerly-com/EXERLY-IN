'use client';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardSubtitle } from "@/components/ui/card";

const SAMPLE = [
  { name: "Global Rice Traders LLC", role: "Buyer", location: "Dubai, UAE", product: "Rice (1121 Basmati)", trust: 92 },
  { name: "AgroLink Exports", role: "Seller", location: "Kolkata, India", product: "Rice (Sona Masoori)", trust: 88 },
  { name: "Sunrise Foods", role: "Seller", location: "Ho Chi Minh, Vietnam", product: "Jasmine Rice", trust: 85 }
];

export default function Matchmaker() {
  const [q, setQ] = useState("");
  const results = q ? SAMPLE.filter(s => (s.product + s.location + s.name).toLowerCase().includes(q.toLowerCase())) : SAMPLE;

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold mb-6">AI Matchmaker</h1>
      <div className="flex gap-2 mb-6">
        <Input placeholder="Search product or company (e.g., rice, basmati, buyer)" value={q} onChange={e => setQ(e.target.value)} />
        <Button variant="secondary">Search</Button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {results.map((r, i) => (
          <Card key={i}>
            <CardTitle>{r.name}</CardTitle>
            <CardSubtitle>{r.role} • {r.location}</CardSubtitle>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">Product: {r.product}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Trust Score: <span className="font-semibold">{r.trust}</span>/100</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
