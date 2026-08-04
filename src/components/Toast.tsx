import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

interface SuccessToastProps {
  message?: string;
}

interface ErrorToastProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Shows a success toast notification
 */
export const showSuccessToast = ({
  message = 'Operation completed successfully',
}: SuccessToastProps = {}) => {
  toast.custom(
    () => (
      <div className='flex max-w-[calc(100vw-28px)] items-center justify-center rounded-lg border border-hairline-strong bg-surface-2 p-3 text-ink-1 shadow-lg'>
        <div className='min-w-0 break-words text-center text-[13px] whitespace-normal'>
          {message}
        </div>
      </div>
    ),
    {
      duration: 5000, // Show for 5 seconds
      position: 'bottom-center', // Position at bottom center
      id: 'success-' + Date.now(), // to prevent duplicate toasts
      style: {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        margin: 0,
      },
    }
  );
};

/**
 * Shows an error toast notification with optional retry button
 */
export const showErrorToast = ({
  message = 'An error occurred',
  onRetry,
}: ErrorToastProps = {}) => {
  toast.custom(
    (t) => (
      <div className='flex max-w-[calc(100vw-28px)] items-center justify-between gap-2 rounded-lg border border-hairline-strong bg-surface-2 p-3 text-ink-1 shadow-lg'>
        <div className='min-w-0 flex-grow break-words text-[13px] whitespace-normal'>
          {message}
        </div>

        {onRetry && (
          <Button
            variant='outline'
            onClick={(e) => {
              e.stopPropagation(); // Prevent toast from closing
              onRetry();
              toast.dismiss(t);
            }}
            className='flex-shrink-0 flex items-center justify-center gap-1 whitespace-nowrap'
            size='sm'
          >
            <RefreshCw className='h-3.5 w-3.5 me-1' />
            Retry
          </Button>
        )}
        <Button
          onClick={() => toast.dismiss(t)}
          variant='outline'
          className='flex-shrink-0'
          size='sm'
          aria-label='Dismiss'
        >
          <X className='h-3 w-3' />
        </Button>
      </div>
    ),
    {
      duration: 5000, // Show for 5 seconds
      position: 'bottom-center', // Position at bottom center
      id: 'error-' + Date.now(), // to prevent duplicate toasts
      style: {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        margin: 0,
      },
    }
  );
};

/**
 * Shows a simple error toast with "Something went wrong" message.
 * Use this after console.error for a consistent error UI.
 */
export const showSomethingWentWrongToast = () => {
  showErrorToast({ message: 'Something went wrong' });
};
