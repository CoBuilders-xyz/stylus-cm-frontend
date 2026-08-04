import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import removeContractImage from 'public/remove-contract.svg';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface RemoveConfirmationModalProps {
  open: boolean;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveConfirmationModal({
  open,
  isRemoving,
  onCancel,
  onConfirm,
}: RemoveConfirmationModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open && !isRemoving) onCancel();
      }}
    >
      <DialogContent
        className='gap-0 p-5 sm:p-6'
        style={{ maxWidth: 'min(448px, calc(100% - 28px))' }}
      >
        {/* Icon */}
        <div className='flex justify-center mb-3 pt-5 sm:pt-3'>
          <Image
            src={removeContractImage}
            alt='Remove contract'
            className='h-auto w-[120px] sm:w-[160px]'
          />
        </div>

        {/* Title and description */}
        <DialogTitle className='text-center leading-snug mb-2'>
          Remove Contract From Your List?
        </DialogTitle>
        <DialogDescription className='text-center leading-relaxed mb-5'>
          This action will remove the contract from your managed list.
          <br />
          All historical data will remain intact.
        </DialogDescription>

        {/* Action buttons */}
        <div className='grid grid-cols-1 sm:grid-cols-[auto_auto] justify-center gap-2'>
          <Button
            onClick={onCancel}
            variant='outline'
            className='w-full sm:w-auto px-5 h-9 rounded-lg'
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant='destructive'
            className='w-full sm:w-auto px-5 h-9 rounded-lg'
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
      </DialogContent>
    </Dialog>
  );
}

export default RemoveConfirmationModal;
