'use client';

import Link from 'next/link';

const items = [
  { title: 'Profile', desc: 'Name, company, address', href: '/dashboard/account/profile' },
  { title: 'Security', desc: 'Password & sessions', href: '/dashboard/account/security' },
  { title: 'Banking', desc: 'Payout bank accounts', href: '/dashboard/account/banking' },
  { title: 'Privacy', desc: 'Data & communication prefs', href: '/dashboard/account/privacy' }
];

export default function AccountHome() {
  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6 text-brand-blue">Account</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:shadow transition"
          >
            <h3 className="text-lg font-semibold">{it.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{it.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
