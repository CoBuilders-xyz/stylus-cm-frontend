import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContractService } from '@/hooks/useContractService';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';

export interface EditableContractNameProps {
  name: string;
  contractId: string;
  onNameChange: (newName: string) => void;
}

export interface EditableContractNameRef {
  setEditing: (isEditing: boolean) => void;
}

function EditableContractName(
  { name, contractId, onNameChange }: EditableContractNameProps,
  ref: React.ForwardedRef<EditableContractNameRef>
) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPencil, setShowPencil] = useState(false);
  const [inputValue, setInputValue] = useState(name || 'Contract Name');
  const [isLoading, setIsLoading] = useState(false);
  const contractService = useContractService();
  const { signalContractUpdated } = useContractsUpdater();

  // Update input value when name prop changes
  useEffect(() => {
    setInputValue(name || 'Contract Name');
  }, [name]);

  // Expose the setIsEditing function via ref
  useImperativeHandle(ref, () => ({
    setEditing: (value: boolean) => {
      setIsEditing(value);
    },
  }));

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setInputValue(name || 'Contract Name');
      setIsEditing(false);
      return;
    }

    if (contractService && contractId) {
      try {
        setIsLoading(true);
        await contractService.updateUserContractName(contractId, inputValue);
        onNameChange(inputValue);

        // Signal that a contract has been updated to trigger a reload
        signalContractUpdated(contractId, 'name');
      } catch (error) {
        console.error('Failed to update contract name:', error);
        // Revert to original name on error
        setInputValue(name || 'Contract Name');
      } finally {
        setIsLoading(false);
        setIsEditing(false);
      }
    } else {
      // Fallback if no service available
      onNameChange(inputValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputValue(name || 'Contract Name');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className='relative group'
      onMouseEnter={() => setShowPencil(true)}
      onMouseLeave={() => setShowPencil(false)}
    >
      {isEditing ? (
        <div className='flex items-center'>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className='text-2xl font-bold bg-transparent outline-none border-0 border-b-2 border-[#3E71C6] w-full'
            placeholder={name || 'Contract Name'}
            style={{ backgroundColor: '#494949' }}
            autoFocus
            disabled={isLoading}
          />
          <div className='flex ml-2'>
            <Button
              onClick={handleSave}
              className='text-white hover:text-green-400 bg-transparent p-0 h-auto'
              disabled={isLoading}
            >
              <Check className='h-5 w-5' />
            </Button>
            <Button
              onClick={handleCancel}
              className='text-white hover:text-red-400 bg-transparent p-0 h-auto ml-1'
              disabled={isLoading}
            >
              <X className='h-5 w-5' />
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex items-center'>
          <div className='text-2xl font-bold mb-1'>
            {name || 'Contract Name'}
          </div>
          {showPencil && !isEditing && (
            <Button
              onClick={handleEditClick}
              className='opacity-0 group-hover:opacity-100 transition-opacity bg-transparent p-0 h-auto ml-2'
            >
              <Pencil className='h-3 w-3 text-gray-400 hover:text-white' />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Use forwardRef to be able to pass refs to the component
const ForwardedEditableContractName = forwardRef<
  EditableContractNameRef,
  EditableContractNameProps
>(EditableContractName);

export default ForwardedEditableContractName;
