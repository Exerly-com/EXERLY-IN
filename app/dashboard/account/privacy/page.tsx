'use client';

export default function PrivacySettings() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-blue">Privacy</h1>
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4" /> Product updates by email
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4" /> Share profile with verified partners
        </label>
        <button className="px-4 py-2 rounded-lg bg-brand-blue text-white">Save Preferences</button>
      </div>
    </div>
  );
}
