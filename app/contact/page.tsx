'use client';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/config";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, msg })
      });
      const j = await r.json();
      if (r.ok) setOk("Thanks! We'll get back to you.");
      else setOk(j.error || "Something went wrong.");
    } catch (e) {
      setOk("Network error.");
    }
  }

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold mb-4">Contact / Early Access</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">We’ll reach out from {SITE.contactEmail}.</p>
      <form onSubmit={submit} className="grid gap-4 max-w-xl">
        <Input label="Your Name" value={name} onChange={e => setName(e.target.value)} required />
        <Input type="email" label="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Textarea label="Message" value={msg} onChange={e => setMsg(e.target.value)} required />
        <Button type="submit" variant="secondary">Send</Button>
      </form>
      {ok && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{ok}</p>}
    </section>
  );
}
