import { AlertTriangle } from 'lucide-react';

export default function PrototypeBanner() {
  return (
    <div className='fixed top-0 left-0 right-0 z-30 h-8 bg-amber-100 dark:bg-amber-950/95 text-amber-900 dark:text-amber-100 px-3 sm:px-4 flex items-center justify-center gap-2 text-[11px] sm:text-xs border-b border-amber-300 dark:border-amber-800/80 backdrop-blur whitespace-nowrap overflow-hidden'>
      <span className='hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-200/80 dark:bg-amber-100/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider'>
        <AlertTriangle className='w-3 h-3' />
        Prototype
      </span>
      <AlertTriangle className='w-3.5 h-3.5 sm:hidden shrink-0' />
      <span className='truncate'>
        <span className='sm:hidden'>Mock data · M1 Activations preview</span>
        <span className='hidden sm:inline'>
          Mock data only · Milestone 1 review of the Stylus Manager
          (Activations) grant.
        </span>
      </span>
    </div>
  );
}
