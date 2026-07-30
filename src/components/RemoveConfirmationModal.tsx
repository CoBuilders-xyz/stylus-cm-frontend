import React from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import removeContractImage from 'public/remove-contract.svg';

interface RemoveConfirmationModalProps {
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveConfirmationModal({
  isRemoving,
  onCancel,
  onConfirm,
}: RemoveConfirmationModalProps) {
  return (
    <div className='fixed inset-0 bg-page/70 flex items-center justify-center z-50'>
      <div className='bg-surface-1 border border-hairline-strong p-6 rounded-xl shadow-lg max-w-md w-full'>
        {/* Close button */}
        <div className='flex justify-end mb-2'>
          <Button
            onClick={onCancel}
            variant='outline'
            size='icon'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {/* Icon */}
        <div className='flex justify-center mb-4'>
          <Image
            src={removeContractImage}
            alt={'remove contract'}
            width={200}
            height={200}
          />
        </div>

        {/* Title and description */}
        <h3 className='text-[15px] font-semibold text-ink-1 text-center mb-2'>
          Remove Contract From Your List?
        </h3>
        <p className='text-center text-ink-2 text-[12.5px] mb-6'>
          This action will remove the contract from your managed list.
          <br />
          All historical data will remain intact.
        </p>

        {/* Action buttons */}
        <div className='flex justify-center gap-3'>
          <Button
            onClick={onCancel}
            variant='outline'
            className='px-5 h-9 rounded-lg'
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant='destructive'
            className='px-5 h-9 rounded-lg'
            disabled={isRemoving}
          >
            {isRemoving ? (
              <>
                <Loader2 className='h-4 w-4 me-2 animate-spin' />
                Removing...
              </>
            ) : (
              'Remove Contract'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RemoveConfirmationModal;
