'use client';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardSubtitle } from "@/components/ui/card";

export default function RiskScoring() {
  const [company, setCompany] = useState("");
  const [score, setScore] = useState<number | null>(null);
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold mb-6">AI Risk Scoring</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Input placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
        <Button variant="secondary" onClick={() => setScore(90)}>Compute Score</Button>
      </div>
      {score !== null && (
        <Card>
          <CardTitle>Risk Result</CardTitle>
          <CardSubtitle>For: {company || "Unnamed Company"}</CardSubtitle>
          <CardContent>
            <p className="text-lg">Trust Score: <span className="font-bold">{score}</span>/100</p>
            <ul className="list-disc pl-6 mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>KYC completed, no sanctions hits</li>
              <li>3 successful past trades</li>
              <li>Verified references</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
