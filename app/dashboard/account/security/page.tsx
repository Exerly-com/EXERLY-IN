'use client';

export default function SecuritySettings() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-blue">Security</h1>
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <p className="text-gray-600 dark:text-gray-300">
          Change password, manage sessions, enable 2FA. (Hook to Supabase auth APIs next.)
        </p>
        <button className="px-4 py-2 rounded-lg bg-brand-blue text-white">Change Password</button>
      </div>
    </div>
  );
}
