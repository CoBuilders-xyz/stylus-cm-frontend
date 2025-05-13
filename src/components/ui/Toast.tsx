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
      <div className='flex items-center w-full bg-black text-white border border-white/10 p-3 rounded-lg shadow-lg'>
        <div className='flex-grow whitespace-nowrap mx-3 text-sm text-center'>
          {message}
        </div>
      </div>
    ),
    {
      duration: 5000, // Show for 5 seconds
      position: 'bottom-center', // Position at bottom center
      id: 'success-' + Date.now(), // to prevent duplicate toasts
      style: {
        width: 'auto',
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
      <div className='flex items-center justify-between w-full bg-black text-white border border-white/10 p-3 rounded-lg shadow-lg gap-2'>
        <div className='flex-grow whitespace-nowrap mx-3 text-sm'>
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
            className='flex-shrink-0 flex items-center justify-center gap-1 bg-transparent text-white border-white/30 hover:bg-white/10 whitespace-nowrap'
            size='sm'
          >
            <RefreshCw className='h-3.5 w-3.5 mr-1' />
            Retry
          </Button>
        )}
        <Button
          onClick={() => toast.dismiss(t)}
          className='flex-shrink-0 bg-transparent text-white border-white/30 hover:bg-white/10'
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
        width: 'auto',
      },
    }
  );
};
