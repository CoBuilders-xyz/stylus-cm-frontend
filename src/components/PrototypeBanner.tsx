import { AlertTriangle } from 'lucide-react';

export default function PrototypeBanner() {
  return (
    <div className='fixed top-0 left-0 right-0 z-30 h-8 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 py-1 px-4 flex items-center justify-center gap-2 text-[11px] sm:text-xs border-b border-amber-300 dark:border-amber-800'>
      <AlertTriangle className='w-4 h-4 shrink-0' />
      <span className='text-center'>
        Prototype preview · Mock data only · For Milestone 1 review of the Stylus
        Manager (Activations) grant.
      </span>
    </div>
  );
}
