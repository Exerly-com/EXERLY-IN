'use client';

import Hero from "@/components/Hero";
import Globe3D from "@/components/Globe";
import Benefits from "@/components/Benefits";
import Metrics from "@/components/Metrics";
import About from "@/components/About";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav /> {/* ✅ Only on homepage */}
      <Hero />
      <Globe3D />
      <Benefits />
      <Metrics />
      <About />
      <Footer /> {/* ✅ Only on homepage */}
    </>
  );
}
