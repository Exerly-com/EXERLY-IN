'use client';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardSubtitle } from "@/components/ui/card";

export default function NegotiationAssistant() {
  const [offer, setOffer] = useState("");
  const [advice, setAdvice] = useState("");

  const analyze = () => {
    setAdvice("Suggested counter: -2% price, +10 days lead time, 30% advance in escrow, 70% on BL scan.");
  };

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold mb-6">AI Negotiation Assistant</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Input placeholder="Paste incoming offer terms" value={offer} onChange={e => setOffer(e.target.value)} />
        <Button variant="secondary" onClick={analyze}>Get Advice</Button>
      </div>
      {advice && (
        <Card>
          <CardTitle>Recommendation</CardTitle>
          <CardSubtitle>Based on best practices and risk tolerance</CardSubtitle>
          <CardContent>
            <p>{advice}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
