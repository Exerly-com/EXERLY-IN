'use client';

export default function ProfileSettings() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-blue">Profile</h1>
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1">Full name</label>
          <input className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
        </div>
        <div>
          <label className="block text-sm mb-1">Company</label>
          <input className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
        </div>
        <button className="px-4 py-2 rounded-lg bg-brand-blue text-white">Save</button>
      </div>
    </div>
  );
}
