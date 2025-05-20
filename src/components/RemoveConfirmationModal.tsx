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
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-[#121212] p-6 rounded-lg max-w-md w-full'>
        {/* Close button */}
        <div className='flex justify-end mb-2'>
          <Button
            onClick={onCancel}
            variant='ghost'
            size='icon'
            className='h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800'
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
        <h3 className='text-xl font-bold text-center mb-2'>
          Remove Contract From Your List?
        </h3>
        <p className='text-center text-gray-400 text-sm mb-6'>
          This action will remove the contract from your managed list.
          <br />
          All historical data will remain intact.
        </p>

        {/* Action buttons */}
        <div className='flex justify-center gap-3'>
          <Button
            onClick={onCancel}
            className='bg-transparent border border-gray-600 hover:bg-gray-800 text-white text-sm px-5 py-2 h-9 rounded-md'
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className='bg-white hover:bg-gray-200 text-black font-medium text-sm px-5 py-2 h-9 rounded-md'
            disabled={isRemoving}
          >
            {isRemoving ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin text-black' />
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
