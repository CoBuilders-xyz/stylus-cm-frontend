'use client';

import { Bell } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div
      className='flex-1 flex flex-col min-h-0 items-center justify-center px-4 py-12 text-center text-gray-300'
      style={{ paddingTop: 'var(--app-chrome-h, 64px)' }}
    >
      <div className='rounded-full bg-[#1A1919] p-4 mb-4 text-gray-400'>
        <Bell className='h-6 w-6' />
      </div>
      <h1 className='text-2xl font-semibold text-white'>Alerts</h1>
      <p className='mt-2 max-w-md text-sm text-gray-400'>
        User-level notification channels and a read-only index of your
        per-contract alerts will land here soon.
      </p>
    </div>
  );
}
