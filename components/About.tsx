export default function About() {
  return (
    <section className="py-20 bg-gradient-to-r from-gray-800 via-black to-gray-800 text-white text-center">
      <h2 className="text-3xl font-bold mb-10">About Us</h2>
      <div className="max-w-4xl mx-auto text-lg leading-relaxed text-gray-300">
        <p>
          Exerly is building the Operating System for global trade, empowering
          businesses to connect, transact, and grow globally. Our mission is to
          simplify cross-border commerce by integrating verified buyers &
          sellers, escrow-secured payments, AI-powered compliance, logistics, and
          trade financing into one seamless platform.
        </p>
        <p className="mt-6">
          With Exerly, SMEs and enterprises gain the tools to trade smarter —
          faster payments, reduced risk, and global reach without outdated
          paperwork and banking delays.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mt-16 text-center">
        <div>
          <p className="text-4xl font-bold">120+</p>
          <p className="text-gray-400 text-sm">Markets Covered</p>
        </div>
        <div>
          <p className="text-4xl font-bold">$500M+</p>
          <p className="text-gray-400 text-sm">Trade Volume</p>
        </div>
        <div>
          <p className="text-4xl font-bold">10,000+</p>
          <p className="text-gray-400 text-sm">Shipments</p>
        </div>
        <div>
          <p className="text-4xl font-bold">24/7</p>
          <p className="text-gray-400 text-sm">Customer Support</p>
        </div>
        <div>
          <p className="text-4xl font-bold">15+</p>
          <p className="text-gray-400 text-sm">Languages Supported</p>
        </div>
      </div>
    </section>
  );
}
