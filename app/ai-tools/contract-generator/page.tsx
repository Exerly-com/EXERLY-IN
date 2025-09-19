'use client';
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardSubtitle } from "@/components/ui/card";

export default function ContractGen() {
  const [details, setDetails] = useState("");
  const [contract, setContract] = useState("");

  const generate = () => {
    const text = `SALE AGREEMENT\n\nParties: Seller and Buyer\nGoods: ${details || "Product"}\nPayment: Escrow, milestone-based\nShipping: INCOTERMS 2020\nGoverning Law: Singapore\n`;
    setContract(text);
  };

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold mb-6">AI Contract Generator</h1>
      <div className="grid gap-4 mb-6 max-w-2xl">
        <Textarea placeholder="Enter deal details: product, quantity, price, incoterms, delivery, etc." value={details} onChange={e => setDetails(e.target.value)} />
        <Button variant="secondary" onClick={generate}>Generate</Button>
      </div>
      {contract && (
        <Card>
          <CardTitle>Draft Contract</CardTitle>
          <CardSubtitle>Copy & review. Legal counsel recommended for live deals.</CardSubtitle>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{contract}</pre>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
