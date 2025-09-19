'use client';

import { FaLock, FaBolt, FaGlobe, FaHandshake } from 'react-icons/fa';

const benefits = [
  {
    icon: <FaLock className="text-brand-blue text-3xl" />,
    title: 'Escrow-Secured Payments',
    description: 'Funds are held in secure escrow accounts until both parties fulfill their commitments.'
  },
  {
    icon: <FaBolt className="text-brand-blue text-3xl" />,
    title: 'Fast Global Settlements',
    description: 'Cross-border transactions cleared within 24 hours with competitive FX rates.'
  },
  {
    icon: <FaGlobe className="text-brand-blue text-3xl" />,
    title: 'AI Compliance & KYC',
    description: 'Automated KYC, KYB, and compliance checks to reduce fraud and delays.'
  },
  {
    icon: <FaHandshake className="text-brand-blue text-3xl" />,
    title: 'Trade Financing',
    description: 'Access working capital and invoice financing to support larger deals globally.'
  }
];

export default function Benefits() {
  return (
    <section className="bg-gradient-to-b from-white dark:from-black to-gray-50 dark:to-gray-950 py-20">
      <div className="container">
        <h2 className="text-3xl font-extrabold text-center mb-12">
          Key Benefits of <span className="text-brand-blue">Exerly</span>
        </h2>
        <div className="grid md:grid-cols-4 gap-10 text-center">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition"
            >
              <div className="flex justify-center mb-4">{b.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
