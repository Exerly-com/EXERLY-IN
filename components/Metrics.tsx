"use client";
import { useEffect, useState } from "react";

function Counter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function Metrics() {
  return (
    <section className="py-20 bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white text-center">
      <h2 className="text-3xl font-bold mb-12">Live Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
        <div>
          <p className="text-5xl font-extrabold text-brand-blue">
            <Counter end={120} />+
          </p>
          <p className="mt-3 text-lg">Verified Markets</p>
        </div>
        <div>
          <p className="text-5xl font-extrabold text-brand-blue">
            $<Counter end={500} />M+
          </p>
          <p className="mt-3 text-lg">Trades Enabled</p>
        </div>
        <div>
          <p className="text-5xl font-extrabold text-brand-blue">
            <Counter end={10000} />+
          </p>
          <p className="mt-3 text-lg">Shipments Secured</p>
        </div>
      </div>
    </section>
  );
}
