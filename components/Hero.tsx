'use client';

import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export default function Hero() {
  const texts = [
    "Bored of your old ways of Import / Export?",
    "The future of trade is Exerly 🚀",
  ];

  const [displayed, setDisplayed] = useState("");
  const [sentence, setSentence] = useState(0);
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[sentence];

    let timeout: NodeJS.Timeout;

    if (!deleting && index < current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, index + 1));
        setIndex(index + 1);
      }, 70); // typing speed
    } else if (deleting && index > 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, index - 1));
        setIndex(index - 1);
      }, 110); // deleting speed (slower, smoother)
    } else if (!deleting && index === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1500); // pause before delete
    } else if (deleting && index === 0) {
      timeout = setTimeout(() => {
        setDeleting(false);
        setSentence((sentence + 1) % texts.length); // next sentence
      }, 600); // pause before typing new one
    }

    return () => clearTimeout(timeout);
  }, [index, deleting, sentence]);

  return (
    <section className="relative overflow-hidden py-20">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-blue via-purple-700 to-black opacity-20 animate-gradient" />

      <div className="container grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Main Pitch */}
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            The Operating System for{" "}
            <span className="text-brand-blue">Global Trade</span>.
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-6 text-lg max-w-xl">
            EXERLY unifies verified buyers & sellers, escrow payments, AI compliance, logistics,
            and trade finance — so cross-border commerce works like e-commerce.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-brand-blue text-white hover:opacity-90 rounded-full px-6 py-3 text-lg shadow-lg button-glow"
              >
                Request Early Access
              </Button>
            </Link>
            <Link href="/product">
              <Button
                size="lg"
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-brand-blue hover:text-white rounded-full px-6 py-3 text-lg shadow-lg button-glow"
              >
                Explore Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side: Challenger Message with Smooth Typing */}
        <div className="p-10 rounded-3xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-blue mb-4">
            {displayed}
            <span className="text-brand-blue animate-pulse">|</span>
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Step into the new world of global trade with <span className="font-semibold">Exerly</span>.  
            No more outdated banking delays, paperwork mountains, or unsecured payments.  
            Trade the smarter way — faster, safer, borderless.
          </p>
          <Link href="/why-exerly">
            <Button
              size="lg"
              className="bg-brand-blue text-white hover:opacity-90 rounded-full px-6 py-3 text-lg shadow-lg button-glow"
            >
              Why Exerly is Better →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
